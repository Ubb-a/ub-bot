const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data.json');

// Initialize data file if it doesn't exist
function initializeDataFile() {
    if (!fs.existsSync(DATA_FILE)) {
        const initialData = {
            roadmaps: {},
            lastUpdated: new Date().toISOString(),
            version: '1.0.0'
        };
        fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
        console.log('📄 Initialized data.json file');
    }
}

// Read data from JSON file
function readData() {
    try {
        initializeDataFile();
        const rawData = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(rawData);
    } catch (error) {
        console.error('Error reading data file:', error);
        // Return default structure if file is corrupted
        return {
            roadmaps: {},
            lastUpdated: new Date().toISOString(),
            version: '1.0.0'
        };
    }
}

// Write data to JSON file
function writeData(data) {
    try {
        data.lastUpdated = new Date().toISOString();
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing data file:', error);
        return false;
    }
}

// Get all roadmaps
function getRoadmaps() {
    const data = readData();
    return data.roadmaps || {};
}

// Get a specific roadmap
function getRoadmap(roadmapId) {
    const roadmaps = getRoadmaps();
    return roadmaps[roadmapId] || null;
}

// Save a roadmap
function saveRoadmap(roadmapId, roadmapData) {
    const data = readData();
    
    if (!data.roadmaps) {
        data.roadmaps = {};
    }
    
    data.roadmaps[roadmapId] = roadmapData;
    
    const success = writeData(data);
    if (!success) {
        throw new Error('Failed to save roadmap data');
    }
    
    console.log(`💾 Saved roadmap: ${roadmapData.name} (${roadmapId})`);
    return true;
}

// Delete a roadmap
function deleteRoadmap(roadmapId) {
    const data = readData();
    
    if (data.roadmaps && data.roadmaps[roadmapId]) {
        const roadmapName = data.roadmaps[roadmapId].name;
        delete data.roadmaps[roadmapId];
        
        const success = writeData(data);
        if (!success) {
            throw new Error('Failed to delete roadmap data');
        }
        
        console.log(`🗑️ Deleted roadmap: ${roadmapName} (${roadmapId})`);
        return true;
    }
    
    return false;
}

// Update a task in a roadmap
function updateTask(roadmapId, taskId, taskData) {
    const data = readData();
    
    if (!data.roadmaps || !data.roadmaps[roadmapId]) {
        throw new Error('Roadmap not found');
    }
    
    const roadmap = data.roadmaps[roadmapId];
    if (!roadmap.tasks) {
        roadmap.tasks = [];
    }
    
    const taskIndex = roadmap.tasks.findIndex(task => task.id === taskId);
    
    if (taskIndex === -1) {
        // Add new task
        taskData.id = taskId;
        taskData.createdAt = new Date().toISOString();
        roadmap.tasks.push(taskData);
    } else {
        // Update existing task
        roadmap.tasks[taskIndex] = { ...roadmap.tasks[taskIndex], ...taskData };
        roadmap.tasks[taskIndex].updatedAt = new Date().toISOString();
    }
    
    const success = writeData(data);
    if (!success) {
        throw new Error('Failed to update task data');
    }
    
    console.log(`📝 Updated task ${taskId} in roadmap: ${roadmap.name}`);
    return true;
}

// Get roadmap statistics
function getRoadmapStats() {
    const roadmaps = getRoadmaps();
    const stats = {
        totalRoadmaps: 0,
        totalTasks: 0,
        completedTasks: 0,
        guilds: new Set()
    };
    
    Object.values(roadmaps).forEach(roadmap => {
        stats.totalRoadmaps++;
        stats.guilds.add(roadmap.guildId);
        
        if (roadmap.tasks) {
            stats.totalTasks += roadmap.tasks.length;
            stats.completedTasks += roadmap.tasks.filter(task => task.status === 'completed').length;
        }
    });
    
    stats.guilds = stats.guilds.size;
    return stats;
}

// Backup data
function createBackup() {
    try {
        const data = readData();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(__dirname, '..', `data-backup-${timestamp}.json`);
        
        fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
        console.log(`💾 Created backup: ${backupPath}`);
        return backupPath;
    } catch (error) {
        console.error('Error creating backup:', error);
        throw error;
    }
}

module.exports = {
    getRoadmaps,
    getRoadmap,
    saveRoadmap,
    deleteRoadmap,
    updateTask,
    getRoadmapStats,
    createBackup,
    readData,
    writeData
};
