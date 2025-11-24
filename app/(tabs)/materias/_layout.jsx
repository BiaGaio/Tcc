import { Stack } from "expo-router";
import { StyleSheet } from "react-native";

export default function MateriasLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                headerStyle: styles.header,
                headerTitleStyle: styles.headerTitle,
                headerTintColor: "#fff",
                headerBackTitleVisible: false,
            }}
        >
            {/* Tela principal de materias */}
            <Stack.Screen
                name="index"
                options={{
                    title: "materias",
                }}
            />

            {/* Tela de detalhes de uma área */}
            <Stack.Screen
                name="[nomeArea]"
                options={({ route }) => ({
                    title: route.params?.area || "Detalhes",
                })}
            />
        </Stack>
    );
}

const styles = StyleSheet.create({
    header: {
        backgroundColor: "#34445B",
    },
    headerTitle: {
        color: "#fff",
        fontSize: 18,
    },
});
