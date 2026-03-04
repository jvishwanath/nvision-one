import { TopBar } from "@/components/top-bar";
import { TaskList } from "@/features/tasks/components/task-list";

export default function TasksPage() {
    return (
        <>
            <TopBar title="Tasks" />
            <div className="p-4">
                <TaskList />
            </div>
        </>
    );
}
