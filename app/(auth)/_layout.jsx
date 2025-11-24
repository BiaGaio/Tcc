import { Stack } from "expo-router";

export default function Layout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false
            }}
        >
            {/* aparecer tela de notificações */}
            <Stack.Screen name="index" options={{ title: "Login" }} />
            <Stack.Screen name="cadastro" options={{ title: "Cadastro" }} />
        </Stack>
    )
}



