import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Card } from "../components/ui/card"

export default function AdminPortal() {
    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-6">Admin Portal</h1>

            <Tabs defaultValue="teams" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="teams">Teams</TabsTrigger>
                    <TabsTrigger value="agents">Agents</TabsTrigger>
                </TabsList>

                <TabsContent value="teams">
                    <Card className="p-6">
                        <h2 className="text-2xl font-semibold mb-4">Team Management</h2>
                        {/* TeamManagement component will go here */}
                        <p className="text-muted-foreground">Team management interface coming soon...</p>
                    </Card>
                </TabsContent>

                <TabsContent value="agents">
                    <Card className="p-6">
                        <h2 className="text-2xl font-semibold mb-4">Agent Assignment</h2>
                        {/* AgentAssignment component will go here */}
                        <p className="text-muted-foreground">Agent assignment interface coming soon...</p>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
