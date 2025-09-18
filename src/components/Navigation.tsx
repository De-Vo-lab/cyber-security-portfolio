import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/use-auth';
import { motion } from 'framer-motion';
import { Menu, User } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, user, signOut } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { href: '#about', label: 'About' },
    { href: '#experience', label: 'Experience' },
    { href: '#skills', label: 'Skills' },
    { href: '#projects', label: 'Projects' },
    { href: '#education', label: 'Education' },
    { href: '#contact', label: 'Contact' },
  ];

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsOpen(false);
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-white/10"
    >
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="text-xl font-bold text-white cursor-pointer"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          Portfolio
        </motion.div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex space-x-8">
          {navItems.map((item) => (
            <motion.button
              key={item.href}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => scrollToSection(item.href)}
              className="text-white/80 hover:text-white transition-colors"
            >
              {item.label}
            </motion.button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <div className="hidden md:flex items-center gap-2">
              <span className="text-white/80 text-sm">
                {user?.name || user?.email || 'User'}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut()}
                className="bg-transparent border-white/20 text-white hover:bg-white/10"
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/auth')}
              className="hidden md:flex bg-transparent border-white/20 text-white hover:bg-white/10"
            >
              <User className="w-4 h-4 mr-2" />
              Sign In
            </Button>
          )}

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-white">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-black/95 border-white/10">
              <div className="flex flex-col space-y-4 mt-8">
                {navItems.map((item) => (
                  <button
                    key={item.href}
                    onClick={() => scrollToSection(item.href)}
                    className="text-white/80 hover:text-white transition-colors text-left py-2"
                  >
                    {item.label}
                  </button>
                ))}
                {isAuthenticated ? (
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-white/80 text-sm mb-2">
                      {user?.name || user?.email || 'User'}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => signOut()}
                      className="bg-transparent border-white/20 text-white hover:bg-white/10"
                    >
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/auth')}
                    className="bg-transparent border-white/20 text-white hover:bg-white/10 mt-4"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Sign In
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.nav>
  );
}
