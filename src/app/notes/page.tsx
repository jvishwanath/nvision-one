import { TopBar } from "@/components/top-bar";
import { NoteList } from "@/features/notes/components/note-list";

export default function NotesPage() {
    return (
        <>
            <TopBar title="Notes" />
            <div className="p-4">
                <NoteList />
            </div>
        </>
    );
}
