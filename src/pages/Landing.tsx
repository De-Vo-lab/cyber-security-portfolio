import ContactForm from '@/components/ContactForm';
import Navigation from '@/components/Navigation';
import SpaceBackground from '@/components/SpaceBackground';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  ExternalLink, 
  Github, 
  Linkedin, 
  Mail, 
  MapPin, 
  Phone 
} from 'lucide-react';

export default function Landing() {
  const skills = [
    'Splunk', 'QRadar', 'Wazuh', 'Log Analysis', 'Alert Triage',
    'MITRE ATT&CK', 'Cyber Kill Chain', 'Threat Intel', 'Vulnerability Analysis',
    'AWS Security/Networking', 'Linux', 'Windows Event Logs', 'Active Directory',
    'Python', 'SQL', 'Wireshark', 'VMs', 'Basic Pentest Tools'
  ];

  const projects = [
    {
      title: 'AI Phishing Email Automation',
      description: 'No-code workflow to ingest emails, enrich IOCs, classify, route paths, and auto-notify SOC; reduced manual triage by ~80%.',
      tech: ['Tines', 'Sublime Security', 'VirusTotal', 'URLScan', 'GPT-4 (opt)'],
      github: 'https://github.com/devarajan-here',
      demo: '#'
    },
    {
      title: 'Malware Analyzer',
      description: 'URL/embedded content analysis with link scanning, basic signature checks, and risk scoring.',
      tech: ['Python', 'Security Analysis', 'URL Scanning'],
      github: 'https://github.com/devarajan-here',
      demo: '#'
    }
  ];

  const experiences = [
    {
      title: 'Cybersecurity Analyst Intern',
      company: 'bblewrap',
      period: '06/2024 – 12/2024',
      description: 'Performed SIEM log analysis and event correlation (Splunk/QRadar); tuned rules to reduce false positives; identified and remediated critical vulnerabilities in MADU application.'
    },
    {
      title: 'Cybersecurity Engineer',
      company: 'Finpro Technologies',
      period: '01/2025',
      description: 'Supported ISO 27001-aligned GRC initiatives; authored procedures and compliance artifacts; delivered pre-sales demos; supported incident workflows per SOC playbooks.'
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden">
      <SpaceBackground />
      <Navigation />
      
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center relative z-10 px-4">
        <div className="text-center max-w-4xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl font-bold mb-8 tracking-tight"
          >
            Devarajan
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex justify-center"
          >
            <Button
              size="lg"
              className="bg-white text-black hover:bg-white/90"
              onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
            >
              More About Me
            </Button>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 relative z-10 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="text-center">
              <h2 className="text-4xl font-bold mb-2">About Me</h2>
              <p className="text-lg text-white/80 leading-relaxed">
                Devarajan P M — Security Analyst / Cybersecurity Professional — India, Kerala, Thrissur
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-white/80">
                <a href="tel:+918330857529" className="inline-flex items-center gap-2 hover:text-white transition">
                  <Phone className="w-4 h-4" /> +91 8330857529
                </a>
                <span className="opacity-40">•</span>
                <a href="mailto:devarajanpm79@gmail.com" className="inline-flex items-center gap-2 hover:text-white transition">
                  <Mail className="w-4 h-4" /> devarajanpm79@gmail.com
                </a>
                <span className="opacity-40">•</span>
                <a
                  href="https://www.linkedin.com/in/devarajan-p-m/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:text-white transition"
                >
                  <Linkedin className="w-4 h-4" /> LinkedIn
                  <ExternalLink className="w-3 h-3" />
                </a>
                <span className="opacity-40">•</span>
                <a
                  href="https://www.github.com/devarajan-here"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:text-white transition"
                >
                  <Github className="w-4 h-4" /> GitHub
                  <ExternalLink className="w-3 h-3" />
                </a>
                <span className="opacity-40">•</span>
                <span className="inline-flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Thrissur, Kerala, India
                </span>
              </div>
            </div>

            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardContent className="p-6 space-y-8">
                <section>
                  <h3 className="text-2xl font-semibold mb-3 text-white">Professional Summary</h3>
                  <p className="text-white/80 leading-relaxed">
                    Aspiring Security Analyst with hands-on experience in incident response, alert triage, and SIEM log analysis.
                    Skilled in threat detection, escalation, and case management workflows, with a strong foundation in network
                    security and threat intelligence. Familiar with ServiceNow for incident tracking and process automation. Eager
                    to contribute to enhancing organizational security posture through proactive monitoring, timely escalation,
                    and continuous process improvement.
                  </p>
                </section>

                <section>
                  <h3 className="text-2xl font-semibold mb-3 text-white">Skills</h3>
                  <div className="grid md:grid-cols-2 gap-4 text-white/80">
                    <div>
                      <h4 className="font-semibold mb-2">SIEM & SOC</h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Splunk, QRadar, Wazuh, Log Analysis, Correlation Rules</li>
                        <li>Alert Triage, Phishing Investigation, Incident Triage & Escalation</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Security Domains</h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Threat Intel, MITRE ATT&CK, Cyber Kill Chain</li>
                        <li>Vulnerability Analysis, Email Security, DLP, ISO 27001</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Cloud & Systems</h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li>AWS Security/Networking, Linux, Windows Event Logs, Active Directory</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Programming & Tools</h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Python, SQL, Wireshark, VMs, Basic Pentest Tools</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-semibold mb-3 text-white">Professional Experience</h3>
                  <div className="space-y-6">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-white">
                        <h4 className="font-semibold">Cybersecurity Analyst Intern — bblewrap</h4>
                        <span className="text-white/60">India (Remote)</span>
                        <span className="text-white/60 inline-flex items-center gap-2">
                          <Calendar className="w-4 h-4" /> 06/2024 – 12/2024
                        </span>
                      </div>
                      <ul className="list-disc list-inside mt-2 text-white/80 space-y-1">
                        <li>Performed SIEM log analysis and event correlation (Splunk/QRadar); increased incident detection by 15%.</li>
                        <li>Tuned correlation rules and evaluated controls to reduce false positives by 10%.</li>
                        <li>Identified and remediated critical vulnerabilities in Manappuram Finance MADU application.</li>
                      </ul>
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-white">
                        <h4 className="font-semibold">Cybersecurity Engineer — Finpro Technologies</h4>
                        <span className="text-white/60">India (Remote)</span>
                        <span className="text-white/60 inline-flex items-center gap-2">
                          <Calendar className="w-4 h-4" /> 01/2025
                        </span>
                      </div>
                      <ul className="list-disc list-inside mt-2 text-white/80 space-y-1">
                        <li>Supported ISO 27001-aligned GRC initiatives: risk assessments, control mapping, policy documentation.</li>
                        <li>Authored procedures and compliance artifacts aligning operations with best practices.</li>
                        <li>Delivered pre-sales cybersecurity demos; mapped technical capabilities to client requirements.</li>
                        <li>Supported incident handling workflows, ensuring timely escalation and closure aligned with SOC playbooks.</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-2xl font-semibold mb-3 text-white">Certifications</h3>
                  <ul className="list-disc list-inside text-white/80 space-y-1">
                    <li>CompTIA Security+ — CompTIA | 08/2025 (Credential ID: COMP001022645550)</li>
                    <li>Generative AI Fundamentals — GeeksforGeeks | Course Completed</li>
                    <li>Google Cybersecurity Professional — Coursera | 03/2024</li>
                    <li>Ethical Hacking Associate — RedTeam | Course Completed</li>
                    <li>Ethical Hacking Essentials — EC-Council | Course Completed</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-2xl font-semibold mb-3 text-white">Education</h3>
                  <ul className="list-disc list-inside text-white/80 space-y-1">
                    <li>B.Tech, Computer Science — APJAKTU - SNMIMT (First Class), 2020–2024</li>
                    <li>Plus Two in Computer Science — MES P Vemballur High School, 2018–2020</li>
                    <li>Class X — T.H.S Kodungallur, 2017–2018</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-2xl font-semibold mb-3 text-white">Projects</h3>
                  <ul className="list-disc list-inside text-white/80 space-y-2">
                    <li>
                      AI Phishing Email Automation (2025): Tines, Sublime Security, VirusTotal, URLScan, GPT-4 (opt).
                      Built a no-code workflow to ingest emails, enrich IOCs, classify, route attachment/non-attachment paths,
                      and auto-notify SOC via Slack/Email; reduced manual triage by ~80%.
                    </li>
                    <li>
                      Malware Analyzer: Implemented URL/embedded content analysis with link scanning, basic signature checks,
                      and risk scoring.
                    </li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-2xl font-semibold mb-3 text-white">Additional Experience & Learning</h3>
                  <ul className="list-disc list-inside text-white/80 space-y-1">
                    <li>Home Lab: VMs with Splunk and Wazuh; simulated attacks/defense; Windows Event Log parsing; phishing investigation.</li>
                    <li>TryHackMe: Cybersecurity Analyst path (SIEM, endpoint protection, phishing analysis).</li>
                    <li>LetsDefend: SOC workflows, MITRE ATT&CK mapping, alert analysis.</li>
                    <li>Stock Market Data Analyzer: Built a tool using APIs and custom algorithms for trend analysis and insights.</li>
                    <li>Interview Assistant Website: AI-powered platform to generate questions, analyze answers, and provide feedback.</li>
                  </ul>
                </section>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 relative z-10 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.h2
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center mb-16"
          >
            Get In Touch
          </motion.h2>
          <div className="grid md:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-semibold mb-6">Let's Connect</h3>
              <p className="text-white/80 mb-8">
                I'm always interested in new opportunities and collaborations. 
                Feel free to reach out if you'd like to work together!
              </p>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Mail className="w-5 h-5 mr-3 text-white/60" />
                  <span>devarajanpm79@gmail.com</span>
                </div>
                <div className="flex items-center">
                  <Phone className="w-5 h-5 mr-3 text-white/60" />
                  <span>+91 8330857529</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 mr-3 text-white/60" />
                  <span>Thrissur, Kerala, India</span>
                </div>
              </div>
              <div className="flex gap-4 mt-8">
                <Button
                  size="icon"
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                  asChild
                >
                  <a href="https://www.linkedin.com/in/devarajan-p-m/" target="_blank" rel="noopener noreferrer">
                    <Linkedin className="w-5 h-5" />
                  </a>
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                  asChild
                >
                  <a href="https://www.github.com/devarajan-here" target="_blank" rel="noopener noreferrer">
                    <Github className="w-5 h-5" />
                  </a>
                </Button>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <ContactForm />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 relative z-10 border-t border-white/10">
        <div className="container mx-auto px-4 text-center">
          <p className="text-white/60">
            © 2024 Devarajan P M. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}