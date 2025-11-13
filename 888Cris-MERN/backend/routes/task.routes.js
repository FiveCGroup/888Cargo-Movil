// routes/task.routes.js
// Rutas para gestión de tareas - Solo definición y delegación
import { Router } from "express";
import { authRequired } from "../middlewares/validateToken.js";
import { 
    getTasks, 
    createTask, 
    getTask, 
    updateTask, 
    deleteTask, 
    toggleTaskCompletion, 
    getTaskStats 
} from "../controllers/task.controller.js";

const router = Router();

// Rutas de tareas - Todas requieren autenticación
router.get("/tasks", authRequired, getTasks);
router.post("/tasks", authRequired, createTask);
router.get("/tasks/stats", authRequired, getTaskStats);
router.get("/tasks/:id", authRequired, getTask);
router.put("/tasks/:id", authRequired, updateTask);
router.delete("/tasks/:id", authRequired, deleteTask);
router.patch("/tasks/:id/toggle", authRequired, toggleTaskCompletion);

export default router;