'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Navbar } from '@/components/Navbar';
import { ArrowRight, Brain, Video, Image as ImageIcon, Zap, Shield, Gauge } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section - Full Screen */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-linear(circle_at_50%_50%,rgba(var(--primary-rgb,99,102,241),0.1),transparent_50%)]" />
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="container mx-auto px-6 py-32">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-background/80 backdrop-blur-sm text-sm shadow-lg">
              <Zap className="h-4 w-4 text-primary" />
              <span className="font-medium">AI-Powered Medical Imaging</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-tight">
              Gyn-Vision
              <span className="block text-4xl md:text-5xl lg:text-6xl mt-4 bg-linear-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                Laparoscopic Segmentation
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Advanced deep learning models for precise anatomical segmentation. 
              Analyze uterus, fallopian tubes, and ovaries with clinical-grade accuracy.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Link href="/segmentation">
                <Button size="lg" className="text-lg px-10 h-14 shadow-lg hover:shadow-xl transition-all">
                  Start Segmentation
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="text-lg px-10 h-14 shadow-lg hover:shadow-xl transition-all">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-muted/20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Powerful Features</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Everything you need for accurate medical image segmentation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature Card 1 */}
            <Card className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl">
              <div className="absolute top-0 right-0 w-32 h-32 opacity-5 group-hover:opacity-10 transition-opacity">
                <Brain className="w-full h-full" />
              </div>
              <div className="relative p-8">
                <h3 className="text-xl font-bold mb-3">Multiple AI Models</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Choose from SegFormer B0, B1, or B2 models optimized for different speed-accuracy trade-offs.
                </p>
              </div>
            </Card>

            {/* Feature Card 2 */}
            <Card className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl">
              <div className="absolute top-0 right-0 w-32 h-32 opacity-5 group-hover:opacity-10 transition-opacity">
                <ImageIcon className="w-full h-full" />
              </div>
              <div className="relative p-8">
                <h3 className="text-xl font-bold mb-3">Image Segmentation</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Upload surgical images and get detailed segmentation masks with anatomical structures highlighted.
                </p>
              </div>
            </Card>

            {/* Feature Card 3 */}
            <Card className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl">
              <div className="absolute top-0 right-0 w-32 h-32 opacity-5 group-hover:opacity-10 transition-opacity">
                <Video className="w-full h-full" />
              </div>
              <div className="relative p-8">
                <h3 className="text-xl font-bold mb-3">Video Processing</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Process entire surgical videos with frame-by-frame segmentation and overlay visualization.
                </p>
              </div>
            </Card>

            {/* Feature Card 4 */}
            <Card className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl">
              <div className="absolute top-0 right-0 w-32 h-32 opacity-5 group-hover:opacity-10 transition-opacity">
                <Gauge className="w-full h-full" />
              </div>
              <div className="relative p-8">
                <h3 className="text-xl font-bold mb-3">Real-time Statistics</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Get instant area percentage calculations and presence detection for each anatomical structure.
                </p>
              </div>
            </Card>

            {/* Feature Card 5 */}
            <Card className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl">
              <div className="absolute top-0 right-0 w-32 h-32 opacity-5 group-hover:opacity-10 transition-opacity">
                <Zap className="w-full h-full" />
              </div>
              <div className="relative p-8">
                <h3 className="text-xl font-bold mb-3">Fast Processing</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Optimized ONNX runtime ensures quick inference with minimal latency for clinical workflows.
                </p>
              </div>
            </Card>

            {/* Feature Card 6 */}
            <Card className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl">
              <div className="absolute top-0 right-0 w-32 h-32 opacity-5 group-hover:opacity-10 transition-opacity">
                <Shield className="w-full h-full" />
              </div>
              <div className="relative p-8">
                <h3 className="text-xl font-bold mb-3">Privacy First</h3>
                <p className="text-muted-foreground leading-relaxed">
                  All processing happens locally on your server. No data is stored or transmitted to external services.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">About This System</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  This segmentation system leverages cutting-edge deep learning technology to assist medical 
                  professionals in analyzing laparoscopic surgical imagery. Built on the SegFormer architecture, 
                  our models provide accurate semantic segmentation of key anatomical structures.
                </p>
                <p>
                  The system identifies four primary classes: background, uterus, fallopian tubes, and ovaries, 
                  with color-coded visualization for easy interpretation. Whether you&apos;re analyzing single images 
                  or full surgical videos, our tool provides consistent, reliable results.
                </p>
                <p>
                  Designed with clinical workflows in mind, the interface is intuitive and efficient, allowing 
                  healthcare professionals to focus on patient care rather than complex software operations.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card className="p-6 text-center border-2">
                <div className="text-3xl font-bold text-primary mb-2">4</div>
                <div className="text-sm text-muted-foreground">Anatomical Classes</div>
              </Card>
              <Card className="p-6 text-center border-2">
                <div className="text-3xl font-bold text-primary mb-2">3</div>
                <div className="text-sm text-muted-foreground">AI Models</div>
              </Card>
              <Card className="p-6 text-center border-2">
                <div className="text-3xl font-bold text-primary mb-2">2</div>
                <div className="text-sm text-muted-foreground">Input Modes</div>
              </Card>
              <Card className="p-6 text-center border-2">
                <div className="text-3xl font-bold text-primary mb-2">100%</div>
                <div className="text-sm text-muted-foreground">Local Processing</div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-linear-to-br from-primary/10 via-background to-secondary/10">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Experience the power of AI-assisted medical image segmentation
          </p>
          <Link href="/segmentation">
            <Button size="lg" className="text-lg px-10">
              Start Segmentation Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-card/50">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">Laparoscopic Segmentation</h3>
              <p className="text-sm text-muted-foreground">
                AI-powered medical imaging analysis for gynecological surgery.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/segmentation" className="hover:text-primary transition-colors">Segmentation Tool</Link></li>
                <li><Link href="#features" className="hover:text-primary transition-colors">Features</Link></li>
                <li><Link href="#about" className="hover:text-primary transition-colors">About</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Technology</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>SegFormer Architecture</li>
                <li>ONNX Runtime</li>
                <li>Next.js & FastAPI</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>&copy; 2025 Gynecology Laparoscopic Segmentation System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
