import { Stack } from "expo-router";
import { StyleSheet } from "react-native";

export default function CronogramaLayout() {
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
            <Stack.Screen
                name="index"
                options={{
                    title: "cronograma",
                }}
            />

            <Stack.Screen
                name="sessoesAtv/[atvID]"
                options={({ route }) => ({
                    title: route.params?.atividade || null,
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
