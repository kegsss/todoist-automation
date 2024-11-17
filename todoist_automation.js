const { TodoistApi } = require('@doist/todoist-api-typescript');

// Use the API token from the environment variable
const api = new TodoistApi(process.env.TODOIST_API_TOKEN);

async function handleRecurringTasksWithHistory() {
  try {
    console.log('Starting Todoist Automation Script...');

    // Step 1: Fetch all projects
    console.log('Fetching all projects...');
    const projects = await api.getProjects();
    console.log('Projects fetched:', projects);

    // Step 2: Find the "Chores" project
    const choresProject = projects.find(project => project.name === 'Chores');
    console.log('Chores project:', choresProject);

    if (!choresProject) {
      console.error('No "Chores" project found! Exiting script.');
      return;
    }

    // Step 3: Fetch tasks in the "Chores" project
    console.log(`Fetching tasks for project "${choresProject.name}" (ID: ${choresProject.id})...`);
    const tasks = await api.getTasks({ projectId: choresProject.id });
    console.log('Tasks fetched:', tasks);

    if (tasks.length === 0) {
      console.log('No tasks found in the "Chores" project. Exiting script.');
      return;
    }

    // Step 4: Process each task
    for (const task of tasks) {
      console.log('Processing task:', task.content);
      console.log('Task details:', task);

      // Check if the task is recurring
      if (task.due && task.due.isRecurring) {
        console.log(`Task "${task.content}" is recurring.`);

        // Check if the task is completed
        if (task.completed) {
          console.log(`Task "${task.content}" is completed.`);

          // Duplicate the task to preserve completion history
          const newTask = await api.addTask({
            content: task.content,
            projectId: choresProject.id,
            dueDate: task.due.date, // Copy the due date
            assigneeId: task.assigneeId, // Preserve the assignee
          });
          console.log(`Created duplicate task for "${task.content}" with ID: ${newTask.id}`);

          // Unassign the original recurring task for the next instance
          await api.updateTask(task.id, { assigneeId: null });
          console.log(`Unassigned the next occurrence of task "${task.content}".`);
        } else {
          console.log(`Task "${task.content}" is not completed yet.`);
        }
      } else {
        console.log(`Task "${task.content}" is not recurring.`);
      }
    }

    console.log('Todoist Automation Script completed successfully.');
  } catch (error) {
    console.error('Error encountered during script execution:', error);
  }
}

// Execute the function
handleRecurringTasksWithHistory();