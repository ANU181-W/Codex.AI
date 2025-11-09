const express = require('express');
const router = express.Router();
const projectController = require('../Controller/projectController');
const { catchAsync } = require('../middleware/error.middleware');
const { validate, schemas } = require('../middleware/validation.middleware');

// Project CRUD Endpoints
router.post('/', 
  validate({ body: schemas.project }), 
  catchAsync(projectController.createProject)
);

router.get('/', 
  catchAsync(projectController.getProjects)
);

router.get('/:id', 
  validate({ params: schemas.projectId }), 
  catchAsync(projectController.getProjectById)
);

router.put('/:id', 
  validate({ 
    params: schemas.projectId,
    body: schemas.project 
  }), 
  catchAsync(projectController.updateProject)
);

router.delete('/:id', 
  validate({ params: schemas.projectId }), 
  catchAsync(projectController.deleteProject)
);

module.exports = router;
