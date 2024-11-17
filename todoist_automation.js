const { TodoistApi } = require('@doist/todoist-api-typescript');

// Initialize the Todoist API using the environment variable for the API token
const api = new TodoistApi(process.env.TODOIST_API_TOKEN);

async function handleRecurringTasksWithHistory() {
  try {
    // Fetch all projects
    const projects = await api.getProjects();
    const choresProject = projects.find(project => project.name === 'Chores');
    if (!choresProject) {
      console.log('Chores project not found.');
      return;
    }

    // Fetch all tasks in the "Chores" project
    const tasks = await api.getTasks({ projectId: choresProject.id });

    for (const task of tasks) {
      // Check if the task is recurring
      if (task.due && task.due.isRecurring) {
        // If the task is completed
        if (task.completed) {
          console.log(`Task "${task.content}" is completed.`);

          // Duplicate the task to preserve completion history
          await api.addTask({
            content: task.content,
            projectId: choresProject.id,
            dueDate: task.due.date, // Copy the due date
            assigneeId: task.assigneeId, // Preserve the assignee
          });
          console.log(`Created duplicate task for "${task.content}" with assignee ${task.assigneeId}`);

          // Unassign the original recurring task for the next instance
          await api.updateTask(task.id, { assigneeId: null });
          console.log(`Unassigned the next occurrence of task "${task.content}".`);
        }
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Execute the function
handleRecurringTasksWithHistory();