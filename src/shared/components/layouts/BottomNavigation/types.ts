export interface BottomNavigationProps<T = string> {
    currentTab: T;
    onTabChange: (tab: T) => void;
}