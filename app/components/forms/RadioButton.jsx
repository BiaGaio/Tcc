import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function RadioButton({ label, selected = false, onSelected = () => { } }) {
    return (
        <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
            onPress={onSelected}
            activeOpacity={0.7}
        >
            <View style={styles.containerRadioButton}>
                {selected && <View style={styles.radioButton} />}
            </View>
            <Text>{label}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    containerRadioButton: {
        borderWidth: 1,
        borderColor: '#34445B',
        height: 20,
        width: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioButton: {
        height: 12,
        width: 12,
        borderRadius: 6,
        backgroundColor: '#34445B',
    }
});
