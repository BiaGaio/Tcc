import { useState } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export default function SelectField({ label, placeholder, options = [], selected, onSelect }) {
    const [showOptions, setShowOptions] = useState(false);

    return (
        <View>
            {label && <Text style={{ marginBottom: 5 }}>{label}</Text>}

            {/* Botão principal do select */}
            <TouchableOpacity
                style={styles.inputSelect}
                onPress={() => setShowOptions(!showOptions)}
            >
                <Text style={{ color: selected ? "#000" : "#888" }}>
                    {selected || placeholder}
                </Text>
                <MaterialIcons
                    size={20}
                    name={showOptions ? "arrow-drop-up" : "arrow-drop-down"}
                    color="#34445B"
                />
            </TouchableOpacity>

            {/* Opções do select */}
            {showOptions && (
                <View
                    style={{
                        borderWidth: 1,
                        borderColor: "#34445B",
                        borderRadius: 8,
                        marginTop: 5,
                        overflow: "hidden",
                    }}
                >
                    <FlatList
                        data={options}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={{
                                    padding: 10,
                                    backgroundColor: item === selected ? "#34445B22" : "#fff",
                                }}
                                onPress={() => {
                                    onSelect(item);
                                    setShowOptions(false);
                                }}
                            >
                                <Text style={{ color: "#000" }}>{item}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    inputSelect: {
        borderWidth: 2,
        borderColor: "#34445B",
        padding: 10,
        flexDirection: "row",
        justifyContent: "space-between",
        borderRadius: 8,
        alignItems: "center",
        height: 40
    },
    
})
