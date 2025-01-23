import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import TeamManagement from "../components/admin/TeamManagement"
import AgentAssignment from "../components/admin/AgentAssignment"
import UserManagement from "../components/admin/UserManagement"

export default function AdminPortal() {
    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-6">Admin Portal</h1>

            <Tabs defaultValue="teams" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="teams">Teams</TabsTrigger>
                    <TabsTrigger value="agents">Agents</TabsTrigger>
                    <TabsTrigger value="users">Users</TabsTrigger>
                </TabsList>

                <TabsContent value="teams">
                    <TeamManagement />
                </TabsContent>

                <TabsContent value="agents">
                    <AgentAssignment />
                </TabsContent>

                <TabsContent value="users">
                    <UserManagement />
                </TabsContent>
            </Tabs>
        </div>
    )
}
