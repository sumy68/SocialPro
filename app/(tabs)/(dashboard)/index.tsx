import { View, Text } from "react-native";
import { useEffect } from "react";

export default function DashboardBoot() {
  useEffect(() => {
    console.log("APP_URL:", process.env.EXPO_PUBLIC_APP_URL);
  }, []);
  return (
    <View style={{flex:1,alignItems:"center",justifyContent:"center"}}>
      <Text style={{fontSize:18}}>Boot OK (Dashboard)</Text>
    </View>
  );
}
