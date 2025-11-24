import { Tabs } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, Text } from "react-native";

export default function Layout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: styles.tabBarStyle,
                tabBarActiveTintColor: "#34445b",
                tabBarInactiveTintColor: "#9BB0C7",
                tabBarLabelStyle: styles.tabBarLabel   
            }}
        >
            <Tabs.Screen
                name="home/index"
                options={{
                    title: "Home",
                    tabBarIcon: ({ color, size }) => (
                        <MaterialIcons name="home" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="cronograma"
                options={{
                    title: "Cronograma",
                    tabBarIcon: ({ color, size }) => (
                        <MaterialIcons name="timer" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="materias"
                options={{
                    title: "materias",
                    tabBarIcon: ({ color, size }) => (
                        <MaterialIcons name="book" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="progresso/index"
                options={{
                    title: "Progresso",
                    tabBarIcon: ({ color, size }) => (
                        <MaterialIcons name="bar-chart" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="configuracoes/index"
                options={{
                    title: "Configurações",
                    tabBarIcon: ({ color, size }) => (
                        <MaterialIcons name="settings" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBarStyle: {
        backgroundColor: "lightblue",
        borderTopWidth: 2,
        borderColor: '#34445B'
    },
    tabBarLabel: {
        fontSize: 12,
        fontWeight: "500",
    },
});

