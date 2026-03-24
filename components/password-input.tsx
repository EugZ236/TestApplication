import React, { useState } from "react";
import {
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
  TextInputProps,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface PasswordInputProps extends Omit<TextInputProps, "secureTextEntry"> {
  containerStyle?: any;
  iconColor?: string;
}

export const PasswordInput = React.forwardRef<TextInput, PasswordInputProps>(
  (
    {
      containerStyle,
      style,
      iconColor = "#888",
      ...rest
    }: PasswordInputProps,
    ref
  ) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const togglePasswordVisibility = () => {
      setIsPasswordVisible(!isPasswordVisible);
    };

    return (
      <View style={[styles.container, containerStyle]}>
        <TextInput
          ref={ref}
          secureTextEntry={!isPasswordVisible}
          style={[styles.input, style]}
          {...rest}
        />
        <TouchableOpacity
          onPress={togglePasswordVisibility}
          style={styles.iconButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={isPasswordVisible ? "eye" : "eye-off"}
            size={24}
            color={iconColor}
          />
        </TouchableOpacity>
      </View>
    );
  }
);

PasswordInput.displayName = "PasswordInput";

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    paddingRight: 48,
  },
  iconButton: {
    position: "absolute",
    right: 12,
    padding: 8,
  },
});
