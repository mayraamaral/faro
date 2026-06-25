import { Tabs } from "expo-router";
import type { SvgProps } from "react-native-svg";

import FeedIcon from "@/assets/images/feed.svg";
import SearchIcon from "@/assets/images/search.svg";
import MatchesIcon from "@/assets/images/matches.svg";
import { tokens, appFonts } from "@/constants/tokens";

type TabIconProps = {
  Icon: React.FC<SvgProps>;
  color: string;
};

function TabIcon({ Icon, color }: TabIconProps) {
  return <Icon width={24} height={24} color={color} />;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tokens.colors.brand.primary,
        tabBarInactiveTintColor: tokens.colors.gray[400],
        tabBarStyle: {
          backgroundColor: tokens.colors.white,
          borderTopColor: tokens.colors.gray[200],
          borderTopWidth: 1,
          height: 96,
          paddingBottom: 24,
          paddingTop: 12,
        },
        tabBarLabelStyle: {
          fontFamily: appFonts.primarySemiBold,
          fontSize: tokens.fontSize.xs,
        },
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          title: "Feed",
          tabBarIcon: ({ color }) => (
            <TabIcon Icon={FeedIcon as React.FC<SvgProps>} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="busca"
        options={{
          title: "Busca",
          tabBarIcon: ({ color }) => (
            <TabIcon Icon={SearchIcon as React.FC<SvgProps>} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: "Conversas",
          tabBarIcon: ({ color }) => (
            <TabIcon Icon={MatchesIcon as React.FC<SvgProps>} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
