import React from 'react';
import { LayoutDashboard, Megaphone, Users, FileText, BarChart3, MessageSquare, Route, Monitor, Smartphone, Globe, ChevronDown, Plus, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
const navigation = [{
  name: 'Dashboards',
  href: '/dashboards',
  icon: LayoutDashboard
}, {
  name: 'Engage',
  href: '/engage',
  icon: Megaphone,
  children: [{
    name: 'Campaigns',
    href: '/engage/campaigns',
    icon: MessageSquare
  }, {
    name: 'Journey',
    href: '/engage/journey',
    icon: Route
  }, {
    name: 'On-site messages',
    href: '/engage/onsite',
    icon: Monitor
  }]
}, {
  name: 'Audiences',
  href: '/audiences',
  icon: Users
}, {
  name: 'Content',
  href: '/content',
  icon: FileText
}, {
  name: 'Analytics',
  href: '/analytics',
  icon: BarChart3
}, {
  name: 'Settings',
  href: '/settings',
  icon: Settings,
  children: [{
    name: 'Account Settings',
    href: '/settings/account',
    icon: Settings
  }]
}];
interface AppLayoutProps {
  children: React.ReactNode;
}
export function AppLayout({
  children
}: AppLayoutProps) {
  return <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="basis-[16rem] flex-shrink-0 bg-primary text-primary-foreground">
        {/* Logo */}
        <div className="p-6 border-b border-primary/20">
          <div className="flex items-center space-x-3">
            <img 
              src="/netcore-logo.svg" 
              alt="Netcore Logo" 
              className="w-8 h-8 rounded-md"
            />
            <div>
              <span className="text-lg font-semibold text-white">netcore</span>
              <p className="text-xs text-primary-foreground/70 -mt-1">CUSTOMER ENGAGEMENT</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navigation.map(item => <div key={item.name}>
              <NavLink to={item.href} className={({
            isActive
          }) => cn("flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors", isActive || item.name === 'Engage' || item.name === 'Settings' ? "bg-primary-foreground/10 text-primary-foreground" : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/5")}>
                <item.icon className="w-4 h-4 mr-3" />
                {item.name}
              </NavLink>
              
              {/* Submenu for Engage */}
              {item.name === 'Engage' && item.children && <div className="ml-7 mt-1 space-y-1">
                  {item.children.map(child => <NavLink key={child.name} to={child.href} className={({
              isActive
            }) => cn("flex items-center px-3 py-1.5 text-sm rounded-md transition-colors", isActive ? "bg-primary-foreground/15 text-primary-foreground font-medium" : "text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/5")}>
                      <child.icon className="w-3 h-3 mr-2" />
                      {child.name}
                    </NavLink>)}
                </div>}

              {/* Submenu for Settings */}
              {item.name === 'Settings' && item.children && <div className="ml-7 mt-1 space-y-1">
                  {item.children.map(child => <NavLink key={child.name} to={child.href} className={({
              isActive
            }) => cn("flex items-center px-3 py-1.5 text-sm rounded-md transition-colors", isActive ? "bg-primary-foreground/15 text-primary-foreground font-medium" : "text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/5")}>
                      <child.icon className="w-3 h-3 mr-2" />
                      {child.name}
                    </NavLink>)}
                </div>}
            </div>)}
        </nav>

        {/* Business Number Section */}
        <div className="px-4 mt-8">
          <h3 className="px-3 text-xs font-semibold text-primary-foreground/50 uppercase tracking-wider">
            Business Number
          </h3>
          <div className="mt-2 space-y-1">
            {/* Current Business Number */}
            <div className="flex items-center justify-between px-3 py-2 text-sm text-primary-foreground/70 rounded-md">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-success rounded-full"></div>
                <span>+91 98765 43210</span>
              </div>
              <span className="text-xs text-success font-medium">Active</span>
            </div>
            
            {/* Add Number Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/5 rounded-md transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <Plus className="w-3 h-3" />
                    <span>Add Number</span>
                  </div>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                side="right" 
                align="start"
                className="w-64 bg-background border border-border shadow-lg z-[100]"
                sideOffset={8}
              >
                <DropdownMenuItem 
                  className="flex items-center space-x-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => {
                    // TODO: Open onboarding flow to add new number
                    console.log('Opening onboarding flow to add new number');
                  }}
                >
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Plus className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-foreground">Add Business Number</span>
                    <p className="text-xs text-muted-foreground">Connect a new WhatsApp Business number</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="flex items-center space-x-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => {
                    console.log('Opening number management');
                  }}
                >
                  <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                    <Smartphone className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-foreground">Manage Numbers</span>
                    <p className="text-xs text-muted-foreground">View and configure existing numbers</p>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Personalization Section */}
        <div className="px-4 mt-8">
          <h3 className="px-3 text-xs font-semibold text-primary-foreground/50 uppercase tracking-wider">
            Personalization
          </h3>
          <div className="mt-2 space-y-1">
            <NavLink to="/personalization/web" className="flex items-center px-3 py-2 text-sm text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/5 rounded-md transition-colors">
              <Globe className="w-4 h-4 mr-3" />
              Web
            </NavLink>
            <NavLink to="/personalization/app" className="flex items-center px-3 py-2 text-sm text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/5 rounded-md transition-colors">
              <Smartphone className="w-4 h-4 mr-3" />
              App
            </NavLink>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-foreground">Engage</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-success rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-success-foreground rounded-full"></div>
                </div>
                <span className="text-sm text-foreground">HDFC</span>
                <span className="text-xs text-success font-medium">Live</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>;
}