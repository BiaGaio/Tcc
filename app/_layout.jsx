import { Stack } from "expo-router";

export default function Layout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false
            }}
        >
            {/* os parenteses sao para esconder o nome da pasta no navegador */}
            {/* ex: na rota, n aparece /tabs/rota... */}
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
    )
}

