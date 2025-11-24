import { View, Text, TextInput, StyleSheet } from "react-native";

export default function InputField({ label = "", value, secureTextEntry = false, onChangeText, placeholder = "Digite o conteúdo" }) {
    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            <TextInput
                style={styles.input}
                placeholder={placeholder}
                secureTextEntry={secureTextEntry}
                placeholderTextColor="#888"
                value={value}
                onChangeText={onChangeText}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // height: 100
    },
    label: {
        marginBottom: 2,
        color: "#34445B",
        fontWeight: "500",
    },
    input: {
        borderWidth: 2,
        borderColor: "#34445B",
        padding: 10,
        borderRadius: 8,
        color: "#000",
    },
});
