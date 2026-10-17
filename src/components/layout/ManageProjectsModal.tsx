"use client";

import { DeleteOutlined, MenuOutlined } from "@ant-design/icons";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { App as AntdApp, Button, Empty, Modal } from "antd";
import type { Project } from "@/types";

function ProjectRow({
  project,
  onDelete,
}: {
  project: Project;
  onDelete: (project: Project) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: project.id,
  });

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 ${
        isDragging ? "z-10 bg-white shadow-md opacity-90" : ""
      }`}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-gray-400 active:cursor-grabbing"
        aria-label="拖拽调整顺序"
        {...listeners}
        {...attributes}
      >
        <MenuOutlined />
      </button>
      <span className="min-w-0 flex-1 truncate">{project.name}</span>
      <Button
        type="text"
        size="small"
        danger
        aria-label="删除项目"
        icon={<DeleteOutlined />}
        onClick={() => onDelete(project)}
      />
    </li>
  );
}

export default function ManageProjectsModal({
  open,
  projects,
  onClose,
  onReorder,
  onDelete,
}: {
  open: boolean;
  projects: Project[];
  onClose: () => void;
  onReorder: (activeId: string, overId: string) => void;
  onDelete: (id: string) => Promise<void>;
}) {
  const { modal } = AntdApp.useApp();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const ids = projects.map((project) => project.id);

  const onDragEnd = (event: DragEndEvent) => {
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : "";
    if (!overId || activeId === overId) return;
    onReorder(activeId, overId);
  };

  const confirmDelete = (project: Project) => {
    modal.confirm({
      title: "删除项目",
      content: `确定删除「${project.name}」？任务和成员会一并删除，且无法恢复。`,
      okText: "删除",
      okType: "danger",
      cancelText: "取消",
      centered: true,
      onOk: () => {
        window.setTimeout(() => {
          void onDelete(project.id);
        }, 0);
      },
    });
  };

  return (
    <Modal title="管理我的项目" open={open} onCancel={onClose} footer={null} destroyOnHidden={false}>
      <p className="mb-3 text-sm text-gray-500">拖动左侧图标调整顺序。删除会永久移除项目。</p>
      {projects.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="还没有项目" />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <ul className="flex flex-col gap-2">
              {projects.map((project) => (
                <ProjectRow key={project.id} project={project} onDelete={confirmDelete} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </Modal>
  );
}
