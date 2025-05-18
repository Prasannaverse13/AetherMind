export function Footer() {
  return (
    <footer className="py-6 mt-auto bg-muted/50 border-t">
      <div className="container mx-auto px-4 text-center text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} AetherMind. All rights reserved.</p>
        <p className="text-sm">Intelligent DeFi Navigator</p>
      </div>
    </footer>
  );
}
