import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Copy, Check, Shield, Lock } from "lucide-react";
import { toast } from "sonner";

// Función para generar contraseña determinística
async function generateDeterministicPassword(
  seeds: string[],
  length: number
): Promise<string> {
  // Combinar las palabras semilla en un único string
  const combinedSeeds = seeds.join("|||");
  
  // Usar Web Crypto API para generar un hash
  const encoder = new TextEncoder();
  const data = encoder.encode(combinedSeeds);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  
  // Definir los conjuntos de caracteres
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const symbols = "!@#$%&*-+=?";
  const allChars = lowercase + uppercase + numbers + symbols;
  
  let password = "";
  
  // Asegurar al menos un carácter de cada tipo
  password += lowercase[hashArray[0] % lowercase.length];
  password += uppercase[hashArray[1] % uppercase.length];
  password += numbers[hashArray[2] % numbers.length];
  password += symbols[hashArray[3] % symbols.length];
  
  // Llenar el resto de la contraseña
  for (let i = 4; i < length; i++) {
    const index = hashArray[i % hashArray.length];
    password += allChars[index % allChars.length];
  }
  
  // Mezclar los caracteres de forma determinística usando Fisher-Yates
  const chars = password.split("");
  for (let i = chars.length - 1; i > 0; i--) {
    // Usar el hash para generar un índice determinístico
    const hashIndex = (i + hashArray[i % hashArray.length]) % hashArray.length;
    const j = (hashArray[hashIndex] + hashArray[(hashIndex + 1) % hashArray.length]) % (i + 1);
    // Intercambiar
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  
  return chars.join("");
}

export default function PasswordGenerator() {
  const [wordCount, setWordCount] = useState<"2" | "3" | "4">("3");
  const [passwordLength, setPasswordLength] = useState<"8" | "12" | "16">("12");
  const [seeds, setSeeds] = useState<string[]>(["", "", ""]);
  const [generatedPassword, setGeneratedPassword] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const handleWordCountChange = (value: "2" | "3" | "4") => {
    setWordCount(value);
    const count = parseInt(value);
    setSeeds(Array(count).fill("").map((_, i) => seeds[i] || ""));
    setGeneratedPassword("");
  };

  const handleSeedChange = (index: number, value: string) => {
    const newSeeds = [...seeds];
    newSeeds[index] = value.trim();
    setSeeds(newSeeds);
  };

  const handleGenerate = async () => {
    // Validar que todas las palabras semilla estén llenas
    if (seeds.some(seed => seed.length === 0)) {
      toast.error("Por favor, completa todas las palabras semilla");
      return;
    }

    const password = await generateDeterministicPassword(
      seeds,
      parseInt(passwordLength)
    );
    setGeneratedPassword(password);
    toast.success("Contraseña generada con éxito");
  };

  const handleCopy = () => {
    if (generatedPassword) {
      navigator.clipboard.writeText(generatedPassword);
      setCopied(true);
      toast.success("Contraseña copiada al portapapeles");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Shield className="w-16 h-16 text-primary" />
              <Lock className="w-8 h-8 text-secondary absolute -bottom-1 -right-1" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Generador de Contraseñas
          </h1>
          <p className="text-muted-foreground text-lg">
            Crea contraseñas seguras con tus palabras semilla
          </p>
        </div>

        {/* Main Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Configuración</CardTitle>
            <CardDescription>
              Tus palabras semilla generarán siempre la misma contraseña
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Word Count Selection */}
            <div className="space-y-3">
              <Label>Número de palabras semilla</Label>
              <RadioGroup
                value={wordCount}
                onValueChange={handleWordCountChange as (value: string) => void}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="2" id="r2" />
                  <Label htmlFor="r2" className="cursor-pointer">2 palabras</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="3" id="r3" />
                  <Label htmlFor="r3" className="cursor-pointer">3 palabras</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="4" id="r4" />
                  <Label htmlFor="r4" className="cursor-pointer">4 palabras</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Seed Words Input */}
            <div className="space-y-3">
              <Label>Palabras semilla (el orden importa)</Label>
              <div className="grid gap-3">
                {seeds.map((seed, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-muted-foreground w-8">
                      {index + 1}.
                    </span>
                    <Input
                      placeholder={`Palabra ${index + 1}`}
                      value={seed}
                      onChange={(e) => handleSeedChange(index, e.target.value)}
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleGenerate();
                        }
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Password Length Selection */}
            <div className="space-y-3">
              <Label>Longitud de la contraseña</Label>
              <RadioGroup
                value={passwordLength}
                onValueChange={setPasswordLength as (value: string) => void}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="8" id="l8" />
                  <Label htmlFor="l8" className="cursor-pointer">8 caracteres</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="12" id="l12" />
                  <Label htmlFor="l12" className="cursor-pointer">12 caracteres</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="16" id="l16" />
                  <Label htmlFor="l16" className="cursor-pointer">16 caracteres</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
              size="lg"
            >
              Generar Contraseña
            </Button>

            {/* Generated Password Display */}
            {generatedPassword && (
              <div className="space-y-3 pt-4 border-t">
                <Label>Tu contraseña segura</Label>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 p-4 bg-muted rounded-lg font-mono text-lg font-bold text-foreground break-all select-all">
                    {generatedPassword}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopy}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  💡 Guarda tus palabras semilla en un lugar seguro. Con ellas siempre podrás regenerar esta contraseña.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-accent/50">
          <CardContent className="pt-6">
            <div className="space-y-2 text-sm">
              <p className="font-medium text-accent-foreground">✨ Características de seguridad:</p>
              <ul className="list-disc list-inside space-y-1 text-accent-foreground/80">
                <li>Generación determinística: mismas palabras = misma contraseña</li>
                <li>Incluye letras mayúsculas, minúsculas, números y símbolos</li>
                <li>El orden de las palabras es importante para mayor seguridad</li>
                <li>Todo el proceso ocurre en tu navegador, sin enviar datos</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
