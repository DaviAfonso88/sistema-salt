import { useContext, useState, useEffect } from "react";
import { AppContext } from "../context/AppContext.jsx";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { FaTrash, FaPlus, FaTasks, FaFolderOpen, FaUser } from "react-icons/fa";
import dayjs from "dayjs";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../service/api";

export default function Management() {
  const { projects, setProjects, currentUser, users } = useContext(AppContext);

  const [projectName, setProjectName] = useState("");
  const [taskName, setTaskName] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [priority, setPriority] = useState("Média");
  const [category, setCategory] = useState("Gestão");

  const statusOptions = ["a fazer", "em andamento", "concluido"];
  const statusColors = {
    "A Fazer": "bg-gray-700 text-white",
    "Em Andamento": "bg-yellow-500 text-black",
    Concluído: "bg-green-500 text-black",
  };
  const priorityColors = {
    Alta: "bg-red-600 text-white",
    Média: "bg-purple-600 text-white",
    Baixa: "bg-green-600 text-white",
  };
  const categoryBorderColors = {
    Gestão: "border-blue-500",
    Financeiro: "border-green-500",
    Comunicação: "border-pink-500",
  };
  const projectColors = ["#6c4bff", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"];

  // --- Load projects from API ---
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get("/projects");
        const data = res.data.map((p) => ({
          ...p,
          tasks: p.tasks || [],
        }));
        setProjects(data);
      } catch (err) {
        console.error(err);
        toast.error("Erro ao carregar projetos.");
      }
    };
    fetchProjects();
  }, [setProjects]);

  // --- Funções ---
  const addProject = async () => {
    if (!projectName.trim())
      return toast.warning("Digite um nome para o projeto!");
    const color = projectColors[projects.length % projectColors.length];
    const newProject = {
      name: projectName,
      userId: currentUser.id,
      color,
      createdAt: new Date().toISOString(),
      tasks: [],
    };

    try {
      const res = await api.post("/projects", newProject);
      setProjects([...projects, { ...res.data, tasks: [] }]);
      toast.success("Projeto criado!");
      setProjectName("");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao criar projeto.");
    }
  };

  const deleteProject = async (id, userId) => {
    if (currentUser.role !== "admin" && currentUser.id !== userId) {
      return toast.error("Sem permissão para excluir!");
    }
    try {
      await api.delete(`/projects/${id}`);
      setProjects(projects.filter((p) => p.id !== id));
      toast.info("Projeto excluído.");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao excluir projeto.");
    }
  };

  const addTask = async () => {
    if (!selectedProject || !taskName.trim())
      return toast.warning("Selecione projeto e digite uma tarefa!");

    const newTask = {
      title: taskName,
      project_id: parseInt(selectedProject),
      status: "a fazer",
      priority, // ✅ prioridade selecionada
      category, // ✅ categoria selecionada
      userId: currentUser.id, // ✅ responsável atual
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await api.post("/tasks", newTask);

      setProjects(
        projects.map((p) =>
          p.id === parseInt(selectedProject)
            ? { ...p, tasks: [...(p.tasks || []), res.data] }
            : p
        )
      );

      toast.success("Tarefa adicionada!");
      setTaskName("");
      setPriority("Média");
      setCategory("Gestão");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao adicionar tarefa.");
    }
  };

  const deleteTask = async (projectId, taskId, taskUserId) => {
    if (currentUser.role !== "admin" && currentUser.id !== taskUserId) {
      return toast.error("Sem permissão para excluir!");
    }
    try {
      await api.delete(`/tasks/${taskId}`);
      setProjects(
        projects.map((p) =>
          p.id === projectId
            ? { ...p, tasks: (p.tasks || []).filter((t) => t.id !== taskId) }
            : p
        )
      );
      toast.info("Tarefa excluída.");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao excluir tarefa.");
    }
  };

  const changeTaskStatus = async (projectId, taskId, status) => {
    try {
      await api.put(`/tasks/${taskId}`, { status });
      setProjects(
        projects.map((p) =>
          p.id === projectId
            ? {
                ...p,
                tasks: (p.tasks || []).map((t) =>
                  t.id === taskId ? { ...t, status } : t
                ),
              }
            : p
        )
      );
      toast.success("Status atualizado!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao atualizar status.");
    }
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const { source, destination } = result;

    const newProjects = [...projects];
    const sourceProject = newProjects.find(
      (p) => p.id === parseInt(source.droppableId)
    );
    const destProject = newProjects.find(
      (p) => p.id === parseInt(destination.droppableId)
    );

    if (!sourceProject || !destProject) return;

    const sourceTasks = [...(sourceProject.tasks || [])];
    const destTasks = [...(destProject.tasks || [])];

    const [movedTask] = sourceTasks.splice(source.index, 1);
    destTasks.splice(destination.index, 0, movedTask);

    sourceProject.tasks = sourceTasks;
    destProject.tasks = destTasks;

    try {
      await api.put(`/tasks/${movedTask.id}`, {
        project_id: destProject.id,
        status: movedTask.status,
      });
      setProjects(newProjects);
      toast.success("Tarefa movida!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao mover tarefa.");
    }
  };

  // --- Dashboard geral ---
  const totalTasks = projects.reduce(
    (acc, p) => acc + (p.tasks?.length || 0),
    0
  );
  const completedTasks = projects.reduce(
    (acc, p) =>
      acc + (p.tasks?.filter((t) => t.status === "Concluído").length || 0),
    0
  );
  const progress = totalTasks
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0;

  return (
    <div className="p-6 min-h-screen bg-[#121214] text-white">
      <ToastContainer position="top-right" autoClose={3000} />
      <h1 className="text-3xl font-semibold text-center mb-6">
        🗂️ Painel de Gestão Profissional
      </h1>

      {/* Mini Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="card flex flex-col items-center">
          <FaTasks className="text-blue-500 text-3xl mb-2" />
          <span className="font-semibold text-lg">Projetos</span>
          <span className="text-xl">{projects.length}</span>
        </div>
        <div className="card flex flex-col items-center">
          <FaUser className="text-green-500 text-3xl mb-2" />
          <span className="font-semibold text-lg">Tarefas Totais</span>
          <span className="text-xl">{totalTasks}</span>
        </div>
        <div className="card flex flex-col items-center">
          <div className="w-full bg-gray-600 rounded-full h-3 mb-2">
            <div
              className="h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%`, backgroundColor: "#6c4bff" }}
            />
          </div>
          <span className="font-semibold text-lg">Progresso Geral</span>
          <span className="text-xl">{progress}%</span>
        </div>
      </div>

      {/* Controle de Projetos/Tarefas */}
      <div className="card flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        {/* Criar Projeto */}
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto items-stretch md:items-center">
          <input
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Novo projeto"
            className="flex-1"
          />
          <button
            onClick={addProject}
            className="btn-primary flex items-center gap-2 whitespace-nowrap"
          >
            <FaFolderOpen /> Criar Projeto
          </button>
        </div>

        {/* Adicionar Tarefa */}
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto items-stretch md:items-center">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="flex-1"
          >
            <option value="">Selecione um projeto</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <input
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            placeholder="Nova tarefa"
            className="flex-1"
          />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-28"
          >
            <option value="Alta">Alta</option>
            <option value="Média">Média</option>
            <option value="Baixa">Baixa</option>
          </select>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-36"
          >
            <option value="Gestão">Gestão</option>
            <option value="Financeiro">Financeiro</option>
            <option value="Comunicação">Comunicação</option>
          </select>
          <button
            onClick={addTask}
            className="btn-secondary flex items-center gap-2 whitespace-nowrap"
          >
            <FaPlus /> Adicionar Tarefa
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-4 mt-6">
          {projects.length === 0 ? (
            <div className="text-center text-gray-400 w-full py-10">
              Nenhum projeto criado ainda. Adicione um acima. 🚀
            </div>
          ) : (
            projects.map((p) => {
              const totalTasks = p.tasks?.length || 0;
              const completedTasks =
                p.tasks?.filter((t) => t.status === "Concluído").length || 0;
              const progress =
                totalTasks === 0
                  ? 0
                  : Math.round((completedTasks / totalTasks) * 100);

              return (
                <Droppable droppableId={p.id.toString()} key={p.id}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="card min-w-[300px] max-w-[340px] flex flex-col"
                      style={{ borderTop: `6px solid ${p.color}` }}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          <FaTasks className="text-blue-500" /> {p.name}
                        </h3>
                        <span className="text-xs text-gray-400">
                          {totalTasks} tarefa{totalTasks !== 1 ? "s" : ""}
                        </span>
                      </div>

                      <div className="w-full bg-gray-600 rounded-full h-3 mb-3">
                        <div
                          className="h-3 rounded-full transition-all duration-300"
                          style={{
                            width: `${progress}%`,
                            backgroundColor: p.color,
                          }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-xs text-gray-400 mb-3">
                        <span>
                          Criado em: {dayjs(p.createdAt).format("DD/MM/YYYY")}
                        </span>
                        <span>
                          Responsável:{" "}
                          {users.find((u) => u.id === p.userId)?.name ||
                            "Desconhecido"}
                        </span>
                      </div>

                      {/* Tasks */}
                      <div className="space-y-3 flex-1">
                        {(p.tasks || []).map((t, index) => {
                          const user = users.find((u) => u.id === t.userId);
                          return (
                            <Draggable
                              key={t.id}
                              draggableId={t.id.toString()}
                              index={index}
                            >
                              {(provided) => (
                                <Tippy
                                  content={
                                    <div className="text-xs">
                                      Responsável:{" "}
                                      {user?.name || "Desconhecido"}
                                      <br />
                                      Criado:{" "}
                                      {dayjs(t.createdAt).format("DD/MM/YYYY")}
                                      <br />
                                      Prioridade: {t.priority || "Média"}
                                      <br />
                                      Equipe: {t.category || "Gestão"}
                                    </div>
                                  }
                                  placement="top"
                                >
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`bg-[#1B1C22] p-4 rounded-xl shadow hover:shadow-md transition flex flex-col cursor-pointer fade-in fade-move border-l-4 ${
                                      categoryBorderColors[t.category] ||
                                      "border-gray-500"
                                    }`}
                                  >
                                    <div className="flex justify-between items-center mb-2">
                                      <span className="font-medium">
                                        {t.name}
                                      </span>
                                      {(currentUser.role === "admin" ||
                                        currentUser.id === t.userId) && (
                                        <button
                                          onClick={() =>
                                            deleteTask(p.id, t.id, t.userId)
                                          }
                                          className="text-red-500 hover:text-red-700 transition"
                                        >
                                          <FaTrash />
                                        </button>
                                      )}
                                    </div>
                                    <div className="flex justify-between items-center text-xs mb-2">
                                      <select
                                        value={t.status}
                                        onChange={(e) =>
                                          changeTaskStatus(
                                            p.id,
                                            t.id,
                                            e.target.value
                                          )
                                        }
                                        className={`px-2 py-1 rounded ${
                                          statusColors[t.status]
                                        }`}
                                      >
                                        {statusOptions.map((s) => (
                                          <option key={s} value={s}>
                                            {s}
                                          </option>
                                        ))}
                                      </select>
                                      <span
                                        className={`px-2 py-1 rounded ${
                                          priorityColors[t.priority || "Média"]
                                        }`}
                                      >
                                        {t.priority || "Média"}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-gray-400">
                                      <span>
                                        Equipe: {t.category || "Gestão"}
                                      </span>
                                      <span>
                                        Criado:{" "}
                                        {dayjs(t.createdAt).format("DD/MM")}
                                      </span>
                                    </div>
                                  </div>
                                </Tippy>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>

                      {(currentUser.role === "admin" ||
                        currentUser.id === p.userId) && (
                        <button
                          onClick={() => deleteProject(p.id, p.userId)}
                          className="btn-secondary mt-4 flex items-center justify-center gap-2"
                        >
                          <FaTrash /> Excluir Projeto
                        </button>
                      )}
                    </div>
                  )}
                </Droppable>
              );
            })
          )}
        </div>
      </DragDropContext>
    </div>
  );
}
