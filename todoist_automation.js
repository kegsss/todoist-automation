const todoist = require('@doist/todoist-api-typescript');

// Replace with your Todoist API token
const api = new todoist.TodoistApi('YOUR_API_TOKEN');

async function processTasks() {
    try {
        // Fetch tasks for the specified project
        const projectId = '2343342190'; // Replace with your project ID
        const tasks = await api.getTasks({ projectId });

        console.log(`\n--- Task Processing Workflow Started ---\n`);
        console.log(`Total tasks fetched: ${tasks.length}\n`);

        let tasksProcessed = 0; // Track how many tasks were processed
        let completedTasks = 0; // Track how many tasks were already completed
        let recurringTasksSkipped = 0; // Track recurring tasks not due yet

        // Iterate through tasks
        tasks.forEach(task => {
            console.log(`Processing task: "${task.content}" (ID: ${task.id})`);

            if (task.isCompleted) {
                console.log(`  - Skipped: Task is already completed.`);
                completedTasks++;
                return;
            }

            if (task.due?.isRecurring && new Date(task.due.datetime) > new Date()) {
                console.log(`  - Skipped: Recurring task not due yet.`);
                recurringTasksSkipped++;
                return;
            }

            // Add your action logic here (e.g., assign or modify the task)
            console.log(`  - Action: Assigning task "${task.content}" to the appropriate user.`);
            // Example action (replace with your actual logic)
            // api.updateTask(task.id, { responsibleUid: 'USER_ID' });

            tasksProcessed++;
        });

        console.log(`\n--- Task Processing Summary ---`);
        console.log(`Tasks fetched: ${tasks.length}`);
        console.log(`Tasks completed (skipped): ${completedTasks}`);
        console.log(`Recurring tasks skipped: ${recurringTasksSkipped}`);
        console.log(`Tasks processed: ${tasksProcessed}`);

        if (tasksProcessed === 0) {
            console.log(`\nNo tasks required processing. Workflow completed.`);
        } else {
            console.log(`\nWorkflow completed with actions on ${tasksProcessed} task(s).`);
        }

    } catch (error) {
        console.error('An error occurred:', error.message);
    }
}

// Run the task processing function
processTasks();