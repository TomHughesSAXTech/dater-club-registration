// Azure Function: index.js
// Deploy this as an HTTP-triggered Azure Function

const { TableClient } = require("@azure/data-tables");

// Connection string from Azure Portal - Table Storage Account
const connectionString = process.env["AzureWebJobsStorage"] || process.env["AZURE_STORAGE_CONNECTION_STRING"];
const submissionsTable = "ClubSubmissions";
const assignmentsTable = "ClubAssignments";

module.exports = async function (context, req) {
    context.res = {
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*', // Update with your domain in production
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    };

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        context.res.status = 200;
        return;
    }

    const tableClient = TableClient.fromConnectionString(connectionString, submissionsTable);
    const assignmentsTableClient = TableClient.fromConnectionString(connectionString, assignmentsTable);

    try {
        // Create tables if they don't exist
        await tableClient.createTable().catch(e => {
            if (e.statusCode !== 409) throw e; // 409 = already exists
        });
        await assignmentsTableClient.createTable().catch(e => {
            if (e.statusCode !== 409) throw e;
        });

        switch (req.method) {
            case 'GET':
                if (req.query.type === 'assignments') {
                    // Get assignments
                    const assignments = [];
                    const assignmentEntities = assignmentsTableClient.listEntities();
                    for await (const entity of assignmentEntities) {
                        assignments.push({
                            clubId: entity.clubId,
                            clubName: entity.clubName,
                            capacity: entity.capacity,
                            students: JSON.parse(entity.students || '[]')
                        });
                    }
                    context.res.body = { assignments };
                } else {
                    // Get all submissions
                    const submissions = [];
                    const entities = tableClient.listEntities();
                    for await (const entity of entities) {
                        submissions.push({
                            studentName: entity.studentName,
                            grade: entity.grade,
                            parentName: entity.parentName,
                            email: entity.email,
                            phone: entity.phone,
                            rankings: JSON.parse(entity.rankings),
                            timestamp: entity.timestamp
                        });
                    }
                    context.res.body = { submissions };
                }
                break;

            case 'POST':
                if (req.body.type === 'assignment') {
                    // Save assignments
                    const { assignments } = req.body;
                    
                    // Clear existing assignments
                    const existingAssignments = assignmentsTableClient.listEntities();
                    for await (const entity of existingAssignments) {
                        await assignmentsTableClient.deleteEntity(entity.partitionKey, entity.rowKey);
                    }
                    
                    // Save new assignments
                    for (const [clubId, data] of Object.entries(assignments)) {
                        const entity = {
                            partitionKey: 'assignment',
                            rowKey: clubId,
                            clubId: clubId,
                            clubName: data.name,
                            capacity: data.capacity,
                            students: JSON.stringify(data.students)
                        };
                        await assignmentsTableClient.createEntity(entity);
                    }
                    
                    context.res.body = { success: true, message: 'Assignments saved' };
                } else {
                    // Submit new registration
                    const submission = req.body;
                    
                    // Check deadline
                    const deadline = new Date('2025-09-21T23:59:59');
                    const now = new Date();
                    
                    if (now > deadline) {
                        context.res.status = 400;
                        context.res.body = { error: 'Registration is closed' };
                        return;
                    }
                    
                    // Create unique key based on student name
                    const rowKey = submission.studentName.toLowerCase().replace(/[^a-z0-9]/g, '');
                    const partitionKey = `grade${submission.grade}`;
                    
                    // Check if student already exists and delete old submission
                    try {
                        await tableClient.deleteEntity(partitionKey, rowKey);
                    } catch (e) {
                        // Entity doesn't exist, that's fine
                    }
                    
                    // Create entity for Table Storage
                    const entity = {
                        partitionKey,
                        rowKey,
                        studentName: submission.studentName,
                        grade: submission.grade,
                        parentName: submission.parentName,
                        email: submission.email,
                        phone: submission.phone,
                        rankings: JSON.stringify(submission.rankings),
                        timestamp: new Date().toISOString()
                    };
                    
                    await tableClient.createEntity(entity);
                    
                    context.res.body = { success: true, message: 'Registration submitted successfully' };
                }
                break;

            case 'DELETE':
                if (req.query.type === 'assignments') {
                    // Clear all assignments
                    const allAssignments = assignmentsTableClient.listEntities();
                    for await (const entity of allAssignments) {
                        await assignmentsTableClient.deleteEntity(entity.partitionKey, entity.rowKey);
                    }
                    context.res.body = { success: true, message: 'Assignments cleared' };
                } else if (req.query.type === 'submissions') {
                    // Clear all submissions
                    const allSubmissions = tableClient.listEntities();
                    for await (const entity of allSubmissions) {
                        await tableClient.deleteEntity(entity.partitionKey, entity.rowKey);
                    }
                    context.res.body = { success: true, message: 'All submissions cleared' };
                } else if (req.query.studentName && req.query.grade) {
                    // Delete specific submission
                    const rowKey = req.query.studentName.toLowerCase().replace(/[^a-z0-9]/g, '');
                    const partitionKey = `grade${req.query.grade}`;
                    
                    try {
                        await tableClient.deleteEntity(partitionKey, rowKey);
                        context.res.body = { success: true, message: 'Submission deleted successfully' };
                    } catch (error) {
                        if (error.statusCode === 404) {
                            context.res.status = 404;
                            context.res.body = { error: 'Submission not found' };
                        } else {
                            throw error;
                        }
                    }
                } else {
                    context.res.status = 400;
                    context.res.body = { error: 'Invalid delete request' };
                }
                break;

            default:
                context.res.status = 405;
                context.res.body = { error: 'Method not allowed' };
        }
    } catch (error) {
        context.log.error('Error:', error);
        context.res.status = 500;
        context.res.body = { error: 'Internal server error', details: error.message };
    }
};
