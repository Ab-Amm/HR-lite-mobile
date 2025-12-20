import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider, MD3LightTheme, ActivityIndicator, Portal } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View } from 'react-native';

import { AppProvider, useApp } from './src/context/AppContext';
import { colors, paperTheme } from './src/theme/theme';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import EmployeeListScreen from './src/screens/EmployeeListScreen';
import EmployeeDetailScreen from './src/screens/EmployeeDetailScreen';
import EditEmployeeScreen from './src/screens/EditEmployeeScreen';
import AddContractScreen from './src/screens/AddContractScreen';
import LeaveManagementScreen from './src/screens/LeaveManagementScreen';
import CreateLeaveScreen from './src/screens/CreateLeaveScreen';
import AddEmployeeScreen from './src/screens/AddEmployeeScreen';
import EmployeesOnLeaveScreen from './src/screens/EmployeesOnLeaveScreen';

// Employee Screens
import EmployeeProfileScreen from './src/screens/employee/EmployeeProfileScreen';
import EmployeeAttendanceScreen from './src/screens/employee/EmployeeAttendanceScreen';
import EmployeeLeaveScreen from './src/screens/employee/EmployeeLeaveScreen';
import EmployeeContractsScreen from './src/screens/employee/EmployeeContractsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Combine theme
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...paperTheme.colors,
  },
  roundness: paperTheme.roundness,
};

const screenOptions = {
  headerStyle: { backgroundColor: colors.primary },
  headerTintColor: colors.textOnPrimary,
  headerTitleStyle: { fontWeight: '600' },
  headerShadowVisible: false,
};

// Bottom Tab Navigator
const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      ...screenOptions,
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        if (route.name === 'Dashboard') {
          iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
        } else if (route.name === 'Employees') {
          iconName = focused ? 'account-group' : 'account-group-outline';
        } else if (route.name === 'Leaves') {
          iconName = focused ? 'calendar-check' : 'calendar-check-outline';
        }
        return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textSecondary,
      tabBarStyle: {
        backgroundColor: colors.surface,
        borderTopColor: colors.border,
        paddingTop: 4,
        paddingBottom: 8,
        height: 60,
      },
    })}
  >
    <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ headerTitle: 'HR Lite' }} />
    <Tab.Screen name="Employees" component={EmployeeListScreen} options={{ headerTitle: 'Employee Directory' }} />
    <Tab.Screen name="Leaves" component={LeaveManagementScreen} options={{ headerTitle: 'Leave Management' }} />
  </Tab.Navigator>
);

const AuthNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
  </Stack.Navigator>
);

// Employee Tab Navigator (for EMPLOYEE role)
const EmployeeTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      ...screenOptions,
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        if (route.name === 'Attendance') {
          iconName = focused ? 'clock-check' : 'clock-check-outline';
        } else if (route.name === 'MyLeaves') {
          iconName = focused ? 'calendar-check' : 'calendar-check-outline';
        } else if (route.name === 'MyContracts') {
          iconName = focused ? 'file-document' : 'file-document-outline';
        } else if (route.name === 'Profile') {
          iconName = focused ? 'account' : 'account-outline';
        }
        return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textSecondary,
      tabBarStyle: {
        backgroundColor: colors.surface,
        borderTopColor: colors.border,
        paddingTop: 4,
        paddingBottom: 8,
        height: 60,
      },
    })}
  >
    <Tab.Screen 
      name="Attendance" 
      component={EmployeeAttendanceScreen} 
      options={{ headerTitle: 'My Attendance' }} 
    />
    <Tab.Screen 
      name="MyLeaves" 
      component={EmployeeLeaveScreen} 
      options={{ headerTitle: 'My Leaves', tabBarLabel: 'Leaves' }} 
    />
    <Tab.Screen 
      name="MyContracts" 
      component={EmployeeContractsScreen} 
      options={{ headerTitle: 'My Contracts', tabBarLabel: 'Contracts' }} 
    />
    <Tab.Screen 
      name="Profile" 
      component={EmployeeProfileScreen} 
      options={{ headerTitle: 'My Profile' }} 
    />
  </Tab.Navigator>
);

const EmployeeNavigator = () => (
  <Stack.Navigator screenOptions={screenOptions}>
    <Stack.Screen name="EmployeeMain" component={EmployeeTabNavigator} options={{ headerShown: false }} />
  </Stack.Navigator>
);

const AppNavigator = () => (
  <Stack.Navigator screenOptions={screenOptions}>
    <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />
    <Stack.Screen name="EmployeeDetail" component={EmployeeDetailScreen} options={{ title: 'Employee Details' }} />
    <Stack.Screen name="EditEmployee" component={EditEmployeeScreen} options={{ title: 'Edit Employee', presentation: 'modal' }} />
    <Stack.Screen name="AddContract" component={AddContractScreen} options={{ title: 'Add Contract', presentation: 'modal' }} />
    <Stack.Screen name="AddEmployee" component={AddEmployeeScreen} options={{ title: 'Add Employee', presentation: 'modal' }} />
    <Stack.Screen name="CreateLeave" component={CreateLeaveScreen} options={{ title: 'Request Leave', presentation: 'modal' }} />
    <Stack.Screen name="EmployeesOnLeave" component={EmployeesOnLeaveScreen} options={{ title: 'On Leave Today' }} />
  </Stack.Navigator>
);

const RootNavigator = () => {
  const { userToken, userRole, isAuthLoading } = useApp();

  if (isAuthLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primary }}>
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" backgroundColor={colors.primary} />
      {!userToken ? (
        <AuthNavigator />
      ) : userRole === 'EMPLOYEE' ? (
        <EmployeeNavigator />
      ) : (
        <AppNavigator />
      )}
    </NavigationContainer>
  );
};

// Main App Navigator
export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AppProvider>
          <Portal.Host>
            <RootNavigator />
          </Portal.Host>
        </AppProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
