import { Snackbar } from "react-native-paper";

export default function AppSnackbar({
  visible,
  type = "neutral",
  message = "",
  onDismiss,
  duration = 2500,
}) {
  const getBackgroundColor = () => {
    switch (type) {
      case "success":
        return "#4CAF50";
      case "failure":
        return "#F44336";
      default:
        return "#323232";
    }
  };

  return (
    <Snackbar
      visible={visible}
      onDismiss={onDismiss}
      duration={duration}
      style={{
        backgroundColor: getBackgroundColor(),
        borderRadius: 10,
        paddingHorizontal: 16,
        marginBottom: 20,
        zIndex: 1000,
        bottom: 50,
      }}
      action={{
        label: "OK",
        labelStyle: { color: "white", fontWeight: "600" },
        onPress: onDismiss,
      }}
    >
      {message}
    </Snackbar>
  );
}
