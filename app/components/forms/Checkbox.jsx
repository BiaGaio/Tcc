import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default function Checkbox({ label, checked, onPress }) {
    const [enabled, setEnabled] = useState(checked ?? false);

    function toggleCheckbox() {
        const newStatus = !enabled;
        setEnabled(newStatus);

        // avisa o componente pai
        if (onPress) {
            onPress(label, newStatus);
        }
    }

    return (
        <TouchableOpacity style={{ flexDirection: 'row', gap: 5, alignItems: "center" }} onPress={toggleCheckbox}>
            <View>
                {
                    enabled
                        ? <MaterialIcons name="check-box" size={22} color="#34445B" />
                        : <MaterialIcons name="check-box-outline-blank" size={22} color="#34445B" />
                }
            </View>
            <Text style={{ fontSize: 15 }}>{label}</Text>
        </TouchableOpacity>
    );
}
