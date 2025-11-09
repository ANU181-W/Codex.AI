// Try to use Prisma if available and configured; otherwise fall back to an in-memory store
let prisma = null;
try {
  const { PrismaClient } = require('@prisma/client');
  prisma = new PrismaClient();
} catch (err) {
  console.warn('Prisma client not available or not generated; using in-memory fallback.');
}

// Simple in-memory fallback store
const inMemoryProjects = [];
const inMemoryFiles = [];
const inMemoryScanResults = [];
const inMemoryIssues = [];

const usePrisma = () => !!(prisma && prisma.project);

exports.createProject = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (usePrisma()) {
      const project = await prisma.project.create({
        data: {
          name,
          description,
        },
      });
      return res.status(201).json(project);
    }

    const newProject = {
      id: String(Date.now()),
      name,
      description,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    inMemoryProjects.push(newProject);
    return res.status(201).json(newProject);
  } catch (err) {
    console.error('Project creation failed:', err);
    return res.status(500).json({ error: 'Failed to create project' });
  }
};

exports.getProjects = async (req, res) => {
  try {
    if (usePrisma()) {
      const projects = await prisma.project.findMany({
        include: {
          _count: {
            select: {
              files: true,
              scanResults: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      return res.json(projects);
    }
    
    const projects = inMemoryProjects.map(project => ({
      ...project,
      _count: {
        files: inMemoryFiles.filter(f => f.projectId === project.id).length,
        scanResults: inMemoryScanResults.filter(s => s.projectId === project.id).length
      }
    }));
    return res.json(projects);
  } catch (err) {
    console.error('Failed to fetch projects:', err);
    return res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (usePrisma()) {
      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          files: true,
          scanResults: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          designTokens: true,
        },
      });
      
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      
      return res.json(project);
    }
    
    const project = inMemoryProjects.find(p => p.id === id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const files = inMemoryFiles.filter(f => f.projectId === id);
    const scanResults = inMemoryScanResults.filter(s => s.projectId === id)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 1);
    
    return res.json({
      ...project,
      files,
      scanResults,
      designTokens: []
    });
  } catch (err) {
    console.error('Failed to fetch project:', err);
    return res.status(500).json({ error: 'Failed to fetch project details' });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    if (usePrisma()) {
      const project = await prisma.project.update({
        where: { id },
        data: {
          name,
          description,
        },
      });
      return res.json(project);
    }
    
    const projectIndex = inMemoryProjects.findIndex(p => p.id === id);
    if (projectIndex === -1) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    inMemoryProjects[projectIndex] = {
      ...inMemoryProjects[projectIndex],
      name,
      description,
      updatedAt: new Date()
    };
    
    return res.json(inMemoryProjects[projectIndex]);
  } catch (err) {
    console.error('Project update failed:', err);
    return res.status(500).json({ error: 'Failed to update project' });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (usePrisma()) {
      await prisma.project.delete({
        where: { id },
      });
      return res.json({ message: 'Project deleted successfully' });
    }
    
    const idx = inMemoryProjects.findIndex(p => p.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    inMemoryProjects.splice(idx, 1);
    // Clean up related data in memory
    inMemoryFiles = inMemoryFiles.filter(f => f.projectId !== id);
    inMemoryScanResults = inMemoryScanResults.filter(s => s.projectId !== id);
    inMemoryIssues = inMemoryIssues.filter(i => !inMemoryFiles.some(f => f.id === i.fileId));
    
    return res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    console.error('Project deletion failed:', err);
    return res.status(500).json({ error: 'Failed to delete project' });
  }
};
