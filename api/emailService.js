const sgMail = require('@sendgrid/mail');

// Initialize SendGrid with API key from environment variables
const initializeSendGrid = () => {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (apiKey) {
        sgMail.setApiKey(apiKey);
        return true;
    }
    return false;
};

// Club information for formatting
const getClubName = (clubId) => {
    const clubs = {
        'yard-games-4': 'Yard Games - 4th Grade',
        'yoga-4': 'Yoga Club - 4th Grade',
        'flag-football-4': 'Flag Football - 4th Grade',
        'art-winter': 'Art Club (Winter) - 4th & 5th Grade',
        'art-spring': 'Art Club (Spring) - 4th & 5th Grade',
        'robotics-4': 'Lego Robotics Club - 4th Grade',
        'yard-games-5': 'Yard Games - 5th Grade',
        'yoga-5': 'Yoga Club - 5th Grade',
        'flag-football-5': 'Flag Football - 5th Grade',
        'robotics-5': 'Lego Robotics Club - 5th Grade'
    };
    return clubs[clubId] || clubId;
};

// Send confirmation email after form submission
async function sendSubmissionConfirmation(submissionData) {
    if (!initializeSendGrid()) {
        console.log('SendGrid not configured - skipping email');
        return { success: false, message: 'Email service not configured' };
    }

    const { studentName, grade, parentName, email, rankings } = submissionData;
    
    // Format the club rankings for the email
    const clubList = rankings
        .sort((a, b) => a.rank - b.rank)
        .map(r => `${r.rank}. ${getClubName(r.clubId)}`)
        .join('\n');

    const emailContent = {
        to: email,
        from: 'noreply@saxtechnology.com',
        subject: `Dater School Club Registration Confirmation - ${studentName}`,
        text: `Dear ${parentName},

Thank you for taking the time to fill out your 2025 Dater Club request! Below is a receipt of your submission. If you have any questions, please reach out to daterpto@ramsey.k12.nj.us.

STUDENT INFORMATION
-------------------
Student Name: ${studentName}
Grade: ${grade}

CLUB PREFERENCES
----------------
${clubList}

CONTACT INFORMATION
-------------------
Parent/Guardian: ${parentName}
Email: ${email}

This is an automated confirmation that we have received your registration. You will receive another email after the registration deadline (September 21st, 2025) with your child's final club assignments.

Thank you,
Dater School PTO`,
        html: `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #0e1130; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 10px 10px; }
        .section { margin-bottom: 25px; }
        .section-title { color: #f2c514; font-size: 18px; font-weight: bold; margin-bottom: 10px; border-bottom: 2px solid #f2c514; padding-bottom: 5px; }
        .club-list { background: white; padding: 15px; border-radius: 5px; margin-top: 10px; }
        .club-item { padding: 5px 0; border-bottom: 1px solid #eee; }
        .club-item:last-child { border-bottom: none; }
        .rank-number { display: inline-block; width: 25px; color: #f2c514; font-weight: bold; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px; color: #666; }
        .highlight { background: #fff3cd; padding: 15px; border-left: 4px solid #f2c514; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Dater School Club Registration Confirmation</h1>
        </div>
        <div class="content">
            <p>Dear ${parentName},</p>
            
            <div class="highlight">
                Thank you for taking the time to fill out your 2025 Dater Club request! Below is a receipt of your submission. If you have any questions, please reach out to <a href="mailto:daterpto@ramsey.k12.nj.us">daterpto@ramsey.k12.nj.us</a>.
            </div>

            <div class="section">
                <div class="section-title">Student Information</div>
                <strong>Student Name:</strong> ${studentName}<br>
                <strong>Grade:</strong> ${grade}
            </div>

            <div class="section">
                <div class="section-title">Club Preferences</div>
                <div class="club-list">
                    ${rankings
                        .sort((a, b) => a.rank - b.rank)
                        .map(r => `<div class="club-item"><span class="rank-number">${r.rank}.</span> ${getClubName(r.clubId)}</div>`)
                        .join('')}
                </div>
            </div>

            <div class="section">
                <div class="section-title">Contact Information</div>
                <strong>Parent/Guardian:</strong> ${parentName}<br>
                <strong>Email:</strong> ${email}
            </div>

            <div class="footer">
                <p><strong>What happens next?</strong></p>
                <p>This is an automated confirmation that we have received your registration. You will receive another email after the registration deadline (September 21st, 2025) with your child's final club assignments.</p>
                <p>Thank you,<br>Dater School PTO</p>
            </div>
        </div>
    </div>
</body>
</html>`
    };

    try {
        await sgMail.send(emailContent);
        console.log(`Confirmation email sent to ${email}`);
        return { success: true, message: 'Confirmation email sent' };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, message: 'Failed to send confirmation email', error: error.toString() };
    }
}

// Send final club assignment results to a parent
async function sendFinalResults(studentData, assignments) {
    if (!initializeSendGrid()) {
        console.log('SendGrid not configured - skipping email');
        return { success: false, message: 'Email service not configured' };
    }

    const { studentName, parentName, email } = studentData;
    
    // Find which clubs the student was assigned to
    const studentClubs = [];
    for (const [clubId, clubData] of Object.entries(assignments)) {
        const studentInClub = clubData.students.find(s => s.name === studentName);
        if (studentInClub) {
            studentClubs.push({
                clubName: clubData.name,
                preference: studentInClub.preference
            });
        }
    }

    // Sort by preference rank
    studentClubs.sort((a, b) => a.preference - b.preference);

    if (studentClubs.length === 0) {
        // Student wasn't assigned to any clubs
        return await sendWaitlistEmail(studentData);
    }

    const clubList = studentClubs
        .map(c => `• ${c.clubName} (Choice #${c.preference})`)
        .join('\n');

    const emailContent = {
        to: email,
        from: 'noreply@saxtechnology.com',
        subject: `Dater School Club Assignments - ${studentName}`,
        text: `Dear ${parentName},

We are pleased to share ${studentName}'s club assignments for the 2025-2026 school year!

CLUB ASSIGNMENTS
----------------
${clubList}

Your child has been successfully enrolled in the clubs listed above. Please note:
• Club schedules and specific meeting times will be communicated by club advisors
• Some clubs may have additional requirements or fees
• If you have any questions, please contact daterpto@ramsey.k12.nj.us

We look forward to seeing ${studentName} participate in these exciting activities!

Thank you,
Dater School PTO`,
        html: `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4caf50; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 10px 10px; }
        .section { margin-bottom: 25px; }
        .section-title { color: #4caf50; font-size: 18px; font-weight: bold; margin-bottom: 10px; border-bottom: 2px solid #4caf50; padding-bottom: 5px; }
        .club-list { background: white; padding: 20px; border-radius: 5px; margin-top: 10px; }
        .club-item { padding: 10px; margin: 10px 0; background: #e8f5e9; border-left: 4px solid #4caf50; border-radius: 3px; }
        .preference-badge { display: inline-block; background: #f2c514; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-left: 10px; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px; color: #666; }
        .success-banner { background: #d4edda; color: #155724; padding: 15px; border-radius: 5px; margin-bottom: 20px; border: 1px solid #c3e6cb; }
        .info-box { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Club Assignments Confirmed!</h1>
        </div>
        <div class="content">
            <div class="success-banner">
                <strong>Great news!</strong> ${studentName} has been successfully assigned to the following clubs for the 2025-2026 school year.
            </div>

            <p>Dear ${parentName},</p>

            <div class="section">
                <div class="section-title">Your Child's Club Assignments</div>
                <div class="club-list">
                    ${studentClubs
                        .map(c => `<div class="club-item">${c.clubName} <span class="preference-badge">Choice #${c.preference}</span></div>`)
                        .join('')}
                </div>
            </div>

            <div class="info-box">
                <strong>Important Information:</strong>
                <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                    <li>Club schedules and specific meeting times will be communicated by club advisors</li>
                    <li>Some clubs may have additional requirements or fees</li>
                    <li>If you have any questions, please contact <a href="mailto:daterpto@ramsey.k12.nj.us">daterpto@ramsey.k12.nj.us</a></li>
                </ul>
            </div>

            <div class="footer">
                <p>We look forward to seeing ${studentName} participate in these exciting activities!</p>
                <p>Thank you,<br>Dater School PTO</p>
            </div>
        </div>
    </div>
</body>
</html>`
    };

    try {
        await sgMail.send(emailContent);
        console.log(`Final results email sent to ${email}`);
        return { success: true, message: 'Results email sent' };
    } catch (error) {
        console.error('Error sending results email:', error);
        return { success: false, message: 'Failed to send results email', error: error.toString() };
    }
}

// Send waitlist notification email
async function sendWaitlistEmail(studentData) {
    if (!initializeSendGrid()) {
        console.log('SendGrid not configured - skipping email');
        return { success: false, message: 'Email service not configured' };
    }

    const { studentName, parentName, email } = studentData;

    const emailContent = {
        to: email,
        from: 'noreply@saxtechnology.com',
        subject: `Dater School Club Registration - Waitlist Status`,
        text: `Dear ${parentName},

Thank you for registering ${studentName} for clubs at Dater School.

Unfortunately, all of the clubs that ${studentName} selected have reached maximum capacity. Your child has been placed on the waitlist for their selected clubs.

WHAT HAPPENS NEXT?
• You will be notified if a spot becomes available
• The school administration will work to accommodate as many students as possible
• Please contact daterpto@ramsey.k12.nj.us if you have questions or would like to discuss alternative options

We appreciate your understanding and will do our best to find club opportunities for ${studentName}.

Thank you,
Dater School PTO`,
        html: `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ffc107; color: #333; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 10px 10px; }
        .waitlist-banner { background: #fff3cd; color: #856404; padding: 15px; border-radius: 5px; margin-bottom: 20px; border: 1px solid #ffeaa7; }
        .section { margin-bottom: 25px; }
        .section-title { color: #ffc107; font-size: 18px; font-weight: bold; margin-bottom: 10px; border-bottom: 2px solid #ffc107; padding-bottom: 5px; }
        .info-box { background: white; padding: 20px; border-radius: 5px; margin-top: 10px; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⏳ Waitlist Status</h1>
        </div>
        <div class="content">
            <div class="waitlist-banner">
                <strong>Current Status:</strong> ${studentName} has been placed on the waitlist for their selected clubs.
            </div>

            <p>Dear ${parentName},</p>
            
            <p>Thank you for registering ${studentName} for clubs at Dater School.</p>
            
            <p>Unfortunately, all of the clubs that ${studentName} selected have reached maximum capacity. Your child has been placed on the waitlist for their selected clubs.</p>

            <div class="section">
                <div class="section-title">What Happens Next?</div>
                <div class="info-box">
                    <ul style="margin: 0; padding-left: 20px;">
                        <li>You will be notified if a spot becomes available</li>
                        <li>The school administration will work to accommodate as many students as possible</li>
                        <li>Please contact <a href="mailto:daterpto@ramsey.k12.nj.us">daterpto@ramsey.k12.nj.us</a> if you have questions or would like to discuss alternative options</li>
                    </ul>
                </div>
            </div>

            <div class="footer">
                <p>We appreciate your understanding and will do our best to find club opportunities for ${studentName}.</p>
                <p>Thank you,<br>Dater School PTO</p>
            </div>
        </div>
    </div>
</body>
</html>`
    };

    try {
        await sgMail.send(emailContent);
        console.log(`Waitlist email sent to ${email}`);
        return { success: true, message: 'Waitlist email sent' };
    } catch (error) {
        console.error('Error sending waitlist email:', error);
        return { success: false, message: 'Failed to send waitlist email', error: error.toString() };
    }
}

// Send final results to all parents
async function sendAllFinalResults(submissions, assignments) {
    if (!initializeSendGrid()) {
        console.log('SendGrid not configured - skipping emails');
        return { success: false, message: 'Email service not configured' };
    }

    const results = {
        sent: [],
        failed: [],
        total: submissions.length
    };

    for (const submission of submissions) {
        try {
            const emailResult = await sendFinalResults(submission, assignments);
            if (emailResult.success) {
                results.sent.push(submission.studentName);
            } else {
                results.failed.push({
                    student: submission.studentName,
                    reason: emailResult.message
                });
            }
            // Add a small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
            results.failed.push({
                student: submission.studentName,
                reason: error.toString()
            });
        }
    }

    return {
        success: results.failed.length === 0,
        sent: results.sent.length,
        failed: results.failed.length,
        details: results
    };
}

module.exports = {
    sendSubmissionConfirmation,
    sendFinalResults,
    sendWaitlistEmail,
    sendAllFinalResults
};
