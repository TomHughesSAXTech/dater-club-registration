// Azure Function: index.js
// Deploy this as an HTTP-triggered Azure Function

const { TableClient } = require("@azure/data-tables");

// Connection string from Azure Portal - Table Storage Account
const connectionString = process.env["AZURE_STORAGE_CONNECTION_STRING"];
const submissionsTable = "ClubSubmissions";
const assignmentsTable = "ClubAssignments";
const clubSettingsTable = "ClubSettings";
const waitlistsTable = "ClubWaitlists";

// Club definitions with capacities
const clubs = {
    '4': [
        { id: 'yard-games-4', name: 'Yard Games - 4th Grade', capacity: 20 },
        { id: 'yoga-4', name: 'Yoga Club - 4th Grade', capacity: 20 },
        { id: 'flag-football-4', name: 'Flag Football - 4th Grade', capacity: 24 },
        { id: 'art-winter', name: 'Art Club (Winter) - 4th & 5th', capacity: 20 },
        { id: 'art-spring', name: 'Art Club (Spring) - 4th & 5th', capacity: 20 },
        { id: 'robotics-4', name: 'Lego Robotics - 4th Grade', capacity: 24 }
    ],
    '5': [
        { id: 'yard-games-5', name: 'Yard Games - 5th Grade', capacity: 20 },
        { id: 'yoga-5', name: 'Yoga Club - 5th Grade', capacity: 20 },
        { id: 'flag-football-5', name: 'Flag Football - 5th Grade', capacity: 24 },
        { id: 'art-winter', name: 'Art Club (Winter) - 4th & 5th', capacity: 20 },
        { id: 'art-spring', name: 'Art Club (Spring) - 4th & 5th', capacity: 20 },
        { id: 'robotics-5', name: 'Lego Robotics - 5th Grade', capacity: 24 }
    ]
};

// Live assignment function with proper randomization
async function runLiveAssignment(tableClient, assignmentsTableClient, context) {
    const waitlistsTableClient = TableClient.fromConnectionString(connectionString, waitlistsTable);
    try {
        // Get all current submissions
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

        if (submissions.length === 0) {
            return; // No submissions to process
        }

        // Initialize assignment structure
        const assignments = {};
        const allClubs = [...clubs['4'], ...clubs['5']];
        
        // Initialize each club with empty arrays
        allClubs.forEach(club => {
            assignments[club.id] = {
                name: club.name,
                capacity: club.capacity,
                students: []
            };
        });

        // Randomize submissions using Fisher-Yates shuffle algorithm
        const shuffledSubmissions = [...submissions];
        for (let i = shuffledSubmissions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledSubmissions[i], shuffledSubmissions[j]] = [shuffledSubmissions[j], shuffledSubmissions[i]];
        }

        // New algorithm: Assign students to ALL their ranked clubs until those clubs fill up
        const studentAssignments = new Map(); // Track what each student has been assigned
        const clubWaitlists = {}; // Track students who couldn't get into full clubs
        
        // Initialize waitlists and student assignments
        allClubs.forEach(club => {
            clubWaitlists[club.id] = [];
        });
        shuffledSubmissions.forEach(submission => {
            studentAssignments.set(submission.studentName, []);
        });
        
        // Process each student's ranked clubs in order
        shuffledSubmissions.forEach(submission => {
            const sortedRankings = submission.rankings.sort((a, b) => a.rank - b.rank);
            
            // Try to assign student to ALL their ranked clubs
            for (let ranking of sortedRankings) {
                const clubId = ranking.clubId;
                const club = assignments[clubId];
                
                if (club) {
                    if (club.students.length < club.capacity) {
                        // Space available - assign to club
                        club.students.push({
                            name: submission.studentName,
                            grade: submission.grade,
                            preference: ranking.rank,
                            email: submission.email,
                            parent: submission.parentName,
                            timestamp: submission.timestamp
                        });
                        studentAssignments.get(submission.studentName).push(clubId);
                    } else {
                        // Club is full - add to waitlist
                        clubWaitlists[clubId].push({
                            name: submission.studentName,
                            grade: submission.grade,
                            preference: ranking.rank,
                            email: submission.email,
                            parent: submission.parentName,
                            timestamp: submission.timestamp
                        });
                    }
                }
            }
        });
        
        // Second pass: For students with no assignments, try to place them in any available club
        shuffledSubmissions.forEach(submission => {
            const currentAssignments = studentAssignments.get(submission.studentName);
            
            // If student has no assignments, try to assign them to any available club for their grade
            if (currentAssignments.length === 0) {
                const gradeClubs = clubs[submission.grade] || [];
                
                // Randomize the order we try clubs
                const shuffledGradeClubs = [...gradeClubs];
                for (let i = shuffledGradeClubs.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [shuffledGradeClubs[i], shuffledGradeClubs[j]] = [shuffledGradeClubs[j], shuffledGradeClubs[i]];
                }
                
                for (let club of shuffledGradeClubs) {
                    if (assignments[club.id].students.length < club.capacity) {
                        assignments[club.id].students.push({
                            name: submission.studentName,
                            grade: submission.grade,
                            preference: 99, // Not their preference
                            email: submission.email,
                            parent: submission.parentName,
                            timestamp: submission.timestamp
                        });
                        studentAssignments.get(submission.studentName).push(club.id);
                        break;
                    }
                }
            }
        });
        
        // Clear existing assignments
        const existingAssignments = assignmentsTableClient.listEntities();
        for await (const entity of existingAssignments) {
            await assignmentsTableClient.deleteEntity(entity.partitionKey, entity.rowKey);
        }
        
        // Clear existing waitlists
        const existingWaitlists = waitlistsTableClient.listEntities();
        for await (const entity of existingWaitlists) {
            await waitlistsTableClient.deleteEntity(entity.partitionKey, entity.rowKey);
        }
        
        // Save new assignments to storage
        for (const [clubId, data] of Object.entries(assignments)) {
            const entity = {
                partitionKey: 'assignment',
                rowKey: clubId,
                clubId: clubId,
                clubName: data.name,
                capacity: data.capacity,
                students: JSON.stringify(data.students),
                lastUpdated: new Date().toISOString()
            };
            await assignmentsTableClient.createEntity(entity);
        }
        
        // Save waitlists to storage
        for (const [clubId, waitlist] of Object.entries(clubWaitlists)) {
            if (waitlist.length > 0) { // Only save if there are students waiting
                const entity = {
                    partitionKey: 'waitlist',
                    rowKey: clubId,
                    clubId: clubId,
                    clubName: assignments[clubId].name,
                    waitlist: JSON.stringify(waitlist),
                    lastUpdated: new Date().toISOString()
                };
                await waitlistsTableClient.createEntity(entity);
            }
        }
        
        context.log('Live assignments updated successfully');
        
    } catch (error) {
        context.log.error('Error in live assignment:', error);
        // Don't throw - we don't want assignment errors to prevent submission success
    }
}

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
    const clubSettingsTableClient = TableClient.fromConnectionString(connectionString, clubSettingsTable);
    const waitlistsTableClient = TableClient.fromConnectionString(connectionString, waitlistsTable);

    try {
        // Create tables if they don't exist
        await tableClient.createTable().catch(e => {
            if (e.statusCode !== 409) throw e; // 409 = already exists
        });
        await assignmentsTableClient.createTable().catch(e => {
            if (e.statusCode !== 409) throw e;
        });
        await clubSettingsTableClient.createTable().catch(e => {
            if (e.statusCode !== 409) throw e;
        });
        await waitlistsTableClient.createTable().catch(e => {
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
                } else if (req.query.type === 'club-settings') {
                    // Get club settings (enabled/disabled clubs)
                    const clubSettings = {};
                    const settingsEntities = clubSettingsTableClient.listEntities();
                    for await (const entity of settingsEntities) {
                        clubSettings[entity.clubId] = {
                            enabled: entity.enabled
                        };
                    }
                    context.res.body = { clubSettings };
                } else if (req.query.type === 'waitlists') {
                    // Get waitlists
                    const waitlists = [];
                    const waitlistEntities = waitlistsTableClient.listEntities();
                    for await (const entity of waitlistEntities) {
                        waitlists.push({
                            clubId: entity.clubId,
                            clubName: entity.clubName,
                            waitlist: JSON.parse(entity.waitlist || '[]')
                        });
                    }
                    context.res.body = { waitlists };
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
                } else if (req.body.type === 'club-settings') {
                    // Update club settings
                    const { clubId, enabled } = req.body;
                    
                    const entity = {
                        partitionKey: 'settings',
                        rowKey: clubId,
                        clubId: clubId,
                        enabled: enabled
                    };
                    
                    // Upsert the entity (create or update)
                    await clubSettingsTableClient.upsertEntity(entity);
                    
                    context.res.body = { success: true, message: 'Club settings updated' };
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
                    
                    // Run live assignment after each submission
                    await runLiveAssignment(tableClient, assignmentsTableClient, context);
                    
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
                        
                        // Run live assignment after deletion
                        await runLiveAssignment(tableClient, assignmentsTableClient, context);
                        
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
