import { TodoistApi } from '@doist/todoist-api-typescript';
import path from 'path';
import { promises as fs } from 'fs';

const api = new TodoistApi(process.env.TODOIST_API_TOKEN);
const processedTasksFile = path.join(process.cwd(), 'processed_tasks.json');

async function handleRecurringTasksWithHistory() {
  try {
    console.log('Fetching all projects...');
    const projects = await api.getProjects();
    console.log(`Found ${projects.length} projects.`);

    const choresProject = projects.find(project => project.name === 'Chores');
    if (!choresProject) {
      console.log('Chores project not found.');
      return;
    }
    console.log(`Found "Chores" project: ${choresProject.name} (ID: ${choresProject.id})`);

    console.log("Fetching active tasks in the 'Chores' project...");
    const activeTasks = await api.getTasks({ projectId: choresProject.id });
    console.log(`Found ${activeTasks.length} active tasks in the "Chores" project.`);

    const now = new Date();
    const lastRun = new Date(now - 24 * 60 * 60 * 1000); // Adjust as needed
    const completedTasksResponse = await fetch('https://api.todoist.com/sync/v9/completed/get_all', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.TODOIST_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        since: lastRun.toISOString(),
        project_id: choresProject.id,
      }),
    });

    if (!completedTasksResponse.ok) {
      throw new Error(`Failed to fetch completed tasks: ${completedTasksResponse.statusText}`);
    }

    const { items: completedTasks } = await completedTasksResponse.json();
    console.log(`Found ${completedTasks.length} completed tasks in the "Chores" project.`);

    let processedTasks = [];
    try {
      processedTasks = JSON.parse(await fs.readFile(processedTasksFile, 'utf-8'));
    } catch {
      console.log('No processed tasks file found. Starting fresh.');
    }

    for (const completedTask of completedTasks) {
      if (processedTasks.includes(completedTask.id)) {
        console.log(`Skipping task "${completedTask.content}" as it has already been processed.`);
        continue;
      }

      const activeCounterpart = activeTasks.find(task => task.content === completedTask.content);

      if (activeCounterpart) {
        console.log(`Task "${completedTask.content}" was completed and has an active counterpart (due: ${activeCounterpart.due?.date || 'unknown'}).`);

        // Duplicate the task as a non-recurring one
        const duplicatedTask = await api.addTask({
          content: completedTask.content,
          projectId: choresProject.id,
          dueDate: completedTask.completed_at, // Use the completion date
          assigneeId: activeCounterpart.assigneeId,
        });
        console.log(`Duplicated task "${completedTask.content}" as non-recurring with assignee ${activeCounterpart.assigneeId || 'none'}.`);

        // Mark the duplicated task as completed
        await api.closeTask(duplicatedTask.id);
        console.log(`Marked duplicated task "${duplicatedTask.content}" as completed.`);

        // Unassign the next instance of the recurring task
        await api.updateTask(activeCounterpart.id, { assigneeId: null });
        console.log(`Unassigned the next occurrence of task "${completedTask.content}".`);
      } else {
        console.log(`Task "${completedTask.content}" has no active counterpart. Skipping.`);
      }

      processedTasks.push(completedTask.id);
    }

    await fs.writeFile(processedTasksFile, JSON.stringify(processedTasks, null, 2));
    console.log('Processing completed.');
  } catch (error) {
    console.error('Error:', error);
  }
}

handleRecurringTasksWithHistory();