import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success('Message sent successfully!', {
      description: 'Thank you for reaching out. I\'ll get back to you soon.',
    });
    
    setIsSubmitting(false);
    (e.target as HTMLFormElement).reset();
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      onSubmit={handleSubmit}
      className="space-y-6 max-w-md mx-auto"
    >
      <div>
        <Input
          type="text"
          name="name"
          placeholder="Your Name"
          required
          className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
        />
      </div>
      <div>
        <Input
          type="email"
          name="email"
          placeholder="Your Email"
          required
          className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
        />
      </div>
      <div>
        <Textarea
          name="message"
          placeholder="Your Message"
          rows={5}
          required
          className="bg-white/5 border-white/20 text-white placeholder:text-white/50 resize-none"
        />
      </div>
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-white text-black hover:bg-white/90"
      >
        {isSubmitting ? (
          'Sending...'
        ) : (
          <>
            Send Message
            <Send className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </motion.form>
  );
}
