import { execSync } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class JSDocGenerator {
  constructor() {
    this.basePath = __dirname; // Cambiado de path.resolve(__dirname, '..') a __dirname
    this.docsOutput = path.join(__dirname, "code-docs");

    this.projects = {
      web: {
        name: "Frontend Web React",
        icon: "🌐",
        description:
          "Aplicación web React para gestión de cargas y packing lists",
        path: path.join(this.basePath, "888Cris-MERN", "client", "src"),
        output: path.join(this.docsOutput, "web"),
        include: ["components", "pages", "services", "hooks", "utils", "logic"],
      },
      backend: {
        name: "Backend API Node.js",
        icon: "⚙️",
        description: "API REST para gestión completa del sistema 888 Cargo",
        path: path.join(this.basePath, "888Cris-MERN", "backend"),
        output: path.join(this.docsOutput, "backend"),
        include: [
          "controllers",
          "routes",
          "models",
          "services",
          "middlewares",
          "utils",
          "validators",
        ],
      },
      mobile: {
        name: "Frontend Mobile React Native",
        icon: "📱",
        description: "Aplicación móvil con Expo/React Native para 888 Cargo",
        path: path.join(this.basePath, "888Cargo"),
        output: path.join(this.docsOutput, "mobile"),
        include: ["services"], // Solo archivos JS por ahora
      },
      tutoriales: {
        name: "Tutoriales",
        icon: "📚",
        description: "Tutoriales y guías relacionadas con 888 Cargo",
        path: path.join(this.basePath, "code-docs", "tutoriales", "markdown"),
        output: path.join(this.docsOutput, "tutoriales"),
        configFile: "typedoc.tutoriales.json",
        include: ["markdown"],
      },
    };
  }

  /**
   * Verifica que TypeDoc esté instalado
   */
  checkTypeDoc() {
    console.log("\n📦 Verificando TypeDoc...\n");

    const typedocPath = path.join(this.basePath, "node_modules", "typedoc");
    if (fs.existsSync(typedocPath)) {
      console.log("✅ TypeDoc ya está instalado\n");
      return true;
    }

    console.log("⚠️  TypeDoc no está instalado");
    console.log("📥 Instalando TypeDoc...\n");

    try {
      execSync("npm install --save-dev typedoc", {
        stdio: "inherit",
        cwd: this.basePath,
      });
      console.log("\n✅ TypeDoc instalado correctamente\n");
      return true;
    } catch (installError) {
      console.log("\n❌ Error al instalar TypeDoc");
      return false;
    }
  }

  /**
   * Crea directorios de salida
   */
  createDirectories() {
    console.log("📁 Creando directorios...\n");

    if (!fs.existsSync(this.docsOutput)) {
      fs.mkdirSync(this.docsOutput, { recursive: true });
    }

    Object.values(this.projects).forEach((project) => {
      if (!fs.existsSync(project.output)) {
        fs.mkdirSync(project.output, { recursive: true });
      }
    });

    console.log("✅ Directorios creados\n");
  }

  /**
   * Crea archivo de configuración JSDoc
   */
  createJSDocConfig(projectKey, project) {
    const sourcePaths = project.include
      .map((dir) => {
        const fullPath = path.join(project.path, dir);
        return fs.existsSync(fullPath) ? fullPath.replace(/\\/g, "/") : null;
      })
      .filter(Boolean);

    if (sourcePaths.length === 0) {
      console.log("⚠️  No se encontraron directorios de código\n");
      return null;
    }

    // Configuración base
    const config = {
      source: {
        include: sourcePaths,
        includePattern: ".+\\.(js|jsx|ts|tsx)$",
        excludePattern: "(node_modules|dist|build|.expo|coverage|__tests__)",
      },
      opts: {
        destination: project.output.replace(/\\/g, "/"),
        recurse: true,
        readme: this.findReadme(project.path),
        encoding: "utf8",
      },
      plugins: ["plugins/markdown"],
      templates: {
        cleverLinks: true,
        monospaceLinks: true,
        default: {
          outputSourceFiles: true,
          includeDate: true,
        },
      },
      markdown: {
        parser: "gfm",
        hardwrap: true,
      },
    };

    // Para el proyecto móvil (TypeScript/React Native), usar jsdoc-babel si está disponible
    if (projectKey === "mobile") {
      const babelPluginPath = path.join(
        this.basePath,
        "node_modules",
        "jsdoc-babel"
      );
      if (fs.existsSync(babelPluginPath)) {
        config.plugins.unshift("node_modules/jsdoc-babel");
        config.babel = {
          presets: [
            ["@babel/preset-env", { targets: { node: "current" } }],
            "@babel/preset-typescript",
            "@babel/preset-react",
          ],
        };
      }
    }

    const configPath = path.join(project.output, "jsdoc-config.json");
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    return configPath;
  }

  /**
   * Busca archivo README
   */
  findReadme(projectPath) {
    const readmePath = path.join(projectPath, "README.md");
    return fs.existsSync(readmePath)
      ? readmePath.replace(/\\/g, "/")
      : undefined;
  }

  /**
   * Instala template docdash si no está instalado
   */
  async installTemplate() {
    const templatePath = path.join(
      this.basePath,
      "docs",
      "node_modules",
      "docdash"
    );

    if (!fs.existsSync(templatePath)) {
      console.log("📥 Instalando template docdash...\n");
      try {
        execSync("npm install docdash --save-dev", {
          stdio: "inherit",
          cwd: path.join(this.basePath, "docs"),
        });
        console.log("✅ Template instalado\n");
      } catch (error) {
        console.log("⚠️  Continuando sin template personalizado\n");
      }
    }
  }

  /**
   * Genera documentación para un proyecto
   */
  async generateDocs(key, project) {
    console.log(
      "======================================================================"
    );
    console.log(`${project.icon} Generando documentación: ${project.name}`);
    console.log(
      "============================================================\n"
    );

    if (!fs.existsSync(project.path)) {
      console.log(`⚠️  Proyecto no encontrado: ${project.path}\n`);
      return false;
    }

    // Usar TypeDoc para todos los proyectos
    return this.generateTypeDoc(key, project);
  }

  /**
   * Genera documentación TypeScript con TypeDoc
   */
  generateTypeDoc(projectKey, project) {
    try {
      console.log("🔄 Ejecutando TypeDoc...\n");

      const configPath = path.join(this.basePath, `typedoc.${projectKey}.json`);

      if (!fs.existsSync(configPath)) {
        console.log(
          `⚠️  Archivo de configuración no encontrado: ${configPath}\n`
        );
        return false;
      }

      const command = `npx typedoc --options "${configPath}"`;

      execSync(command, {
        stdio: "inherit",
        shell: true,
        cwd: this.basePath,
      });

      console.log(`\n✅ Documentación generada en: ${project.output}\n`);
      return true;
    } catch (error) {
      console.log(`\n⚠️  Error al generar documentación con TypeDoc\n`);
      return false;
    }
  }

  /**
   * Actualiza página índice
   */
  updateIndexPage() {
    console.log("📄 Generando página índice mejorada...\n");

    const indexPath = path.join(this.docsOutput, "index.html");

    const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>888 Cargo - Documentación del Código</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
        }

        .header {
            text-align: center;
            color: white;
            margin-bottom: 50px;
            padding: 30px 0;
        }

        .header h1 {
            font-size: 3em;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }

        .header p {
            font-size: 1.2em;
            opacity: 0.9;
        }

        .nav-menu {
            background: white;
            border-radius: 15px;
            padding: 20px;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }

        .nav-menu h2 {
            color: #333;
            margin-bottom: 15px;
            font-size: 1.5em;
        }

        .nav-links {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
        }

        .nav-link {
            padding: 10px 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            transition: all 0.3s ease;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }

        .nav-link:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        }

        .cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 30px;
            margin-bottom: 30px;
        }

        .card {
            background: white;
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            display: flex;
            flex-direction: column;
            height: 100%;
        }

        .card:hover {
            transform: translateY(-10px);
            box-shadow: 0 15px 40px rgba(0,0,0,0.3);
        }

        .card-icon {
            font-size: 3em;
            margin-bottom: 15px;
        }

        .card-title {
            font-size: 1.5em;
            font-weight: bold;
            margin-bottom: 10px;
            color: #333;
        }

        .card-description {
            color: #666;
            line-height: 1.6;
            margin-bottom: 20px;
            flex-grow: 1;
        }

        .card-sections {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }

        .card-sections h4 {
            color: #333;
            margin-bottom: 10px;
            font-size: 1em;
        }

        .card-sections ul {
            list-style: none;
            padding-left: 0;
        }

        .card-sections li {
            padding: 5px 0;
            color: #666;
            font-size: 0.9em;
        }

        .card-sections li:before {
            content: "📄 ";
            margin-right: 5px;
        }

        .card-link {
            display: inline-block;
            padding: 12px 25px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 8px;
            text-decoration: none;
            font-weight: bold;
            text-align: center;
            transition: all 0.3s ease;
        }

        .card-link:hover {
            opacity: 0.9;
            transform: scale(1.05);
        }

        .info-section {
            background: white;
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }

        .info-section h2 {
            color: #333;
            margin-bottom: 20px;
            font-size: 1.8em;
        }

        .info-section h3 {
            color: #667eea;
            margin-top: 20px;
            margin-bottom: 10px;
            font-size: 1.3em;
        }

        .info-section p, .info-section ul {
            color: #666;
            line-height: 1.8;
            margin-bottom: 15px;
        }

        .info-section ul {
            padding-left: 25px;
        }

        .footer {
            text-align: center;
            color: white;
            margin-top: 30px;
            padding: 20px;
            opacity: 0.8;
        }

        @media (max-width: 768px) {
            .header h1 {
                font-size: 2em;
            }

            .cards {
                grid-template-columns: 1fr;
            }

            .nav-links {
                flex-direction: column;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📦 888 Cargo</h1>
            <p>Documentación Técnica del Código - JSDoc</p>
        </div>

        <div class="nav-menu">
            <h2>🧭 Navegación Rápida</h2>
            <div class="nav-links">
                <a href="#proyectos" class="nav-link">📚 Proyectos</a>
                <a href="#info" class="nav-link">ℹ️ Información</a>
                <a href="web/index.html" class="nav-link">🌐 Frontend Web</a>
                <a href="backend/index.html" class="nav-link">⚙️ Backend API</a>
                <a href="mobile/index.html" class="nav-link">📱 Mobile App</a>
            </div>
        </div>

        <div id="proyectos">
            <div class="cards">
                <div class="card">
                    <div class="card-icon">🌐</div>
                    <div class="card-title">Frontend Web React</div>
                    <div class="card-description">
                        Aplicación web desarrollada en React para la gestión completa del sistema 888 Cargo.
                        Incluye interfaz de usuario para packing lists, cargas, usuarios y más.
                    </div>
                    <div class="card-sections">
                        <h4>📂 Módulos Principales:</h4>
                        <ul>
                            <li>Components - Componentes reutilizables</li>
                            <li>Pages - Páginas de la aplicación</li>
                            <li>Services - Servicios de API</li>
                            <li>Hooks - Custom React Hooks</li>
                            <li>Utils - Utilidades y helpers</li>
                        </ul>
                    </div>
                    <a href="web/index.html" class="card-link">Ver Documentación Web →</a>
                </div>

                <div class="card">
                    <div class="card-icon">⚙️</div>
                    <div class="card-title">Backend API Node.js</div>
                    <div class="card-description">
                        API REST desarrollada en Node.js/Express para gestionar toda la lógica de negocio
                        del sistema 888 Cargo. Incluye autenticación, gestión de cargas, usuarios y más.
                    </div>
                    <div class="card-sections">
                        <h4>📂 Módulos Principales:</h4>
                        <ul>
                            <li>Controllers - Lógica de controladores</li>
                            <li>Routes - Definición de rutas</li>
                            <li>Models - Modelos de datos</li>
                            <li>Services - Lógica de negocio</li>
                            <li>Middlewares - Middlewares personalizados</li>
                            <li>Validators - Validación de datos</li>
                        </ul>
                    </div>
                    <a href="backend/index.html" class="card-link">Ver Documentación Backend →</a>
                </div>

                <div class="card">
                    <div class="card-icon">📱</div>
                    <div class="card-title">Frontend Mobile React Native</div>
                    <div class="card-description">
                        Aplicación móvil desarrollada con Expo y React Native para 888 Cargo.
                        Permite gestión móvil de cargas, visualización de QR, y acceso en movimiento.
                    </div>
                    <div class="card-sections">
                        <h4>📂 Módulos Principales:</h4>
                        <ul>
                            <li>App - Navegación y rutas</li>
                            <li>Components - Componentes móviles</li>
                            <li>Hooks - Custom hooks móviles</li>
                            <li>Services - Servicios de API móvil</li>
                            <li>Constants - Constantes y configuración</li>
                            <li>Pages - Pantallas de la app</li>
                        </ul>
                    </div>

                    di<div>
                        <div class="card-icon">📚</div>
                        <v class="card-title">Tutoriales</div>
                        <div class="card-description">
                            Colección de tutoriales y guías relacionadas con el uso y desarrollo del sistema 888 Cargo.
                            Incluye instrucciones paso a paso para diversas funcionalidades.
                        </div>
                        <div class="card-sections">
                            <h4>📂 Módulos Principales:</h4>
                            <ul>
                                <li>Introducción a 888 Cargo</li>
                                <li>Configuración del Entorno</li>
                                <li>Uso de la API REST</li>
                                <li>Desarrollo de Componentes</li>
                                <li>Implementación de Funcionalidades</li>
                            </ul>
                        </div>
                        <a href="./tutoriales/" class="card-link">Ver Tutoriales →</a>
                    </div>

                    </div>
                    <a href="mobile/index.html" class="card-link">Ver Documentación Mobile →</a>
                </div>
            </div>
        </div>

        <div id="info" class="info-section">
            <h2>ℹ️ Información del Proyecto</h2>
            
            <h3>📋 Acerca de 888 Cargo</h3>
            <p>
                Sistema integral de gestión de cargas y packing lists. El proyecto está dividido en tres
                componentes principales que trabajan de manera integrada para ofrecer una solución completa.
            </p>

            <h3>🏗️ Arquitectura del Sistema</h3>
            <ul>
                <li><strong>Frontend Web:</strong> Aplicación React para escritorio/navegador</li>
                <li><strong>Backend API:</strong> API REST Node.js/Express con MongoDB/SQLite</li>
                <li><strong>Mobile App:</strong> Aplicación móvil React Native/Expo</li>
            </ul>

            <h3>🛠️ Tecnologías Utilizadas</h3>
            <ul>
                <li><strong>Frontend Web:</strong> React, Vite, React Router, Axios</li>
                <li><strong>Backend:</strong> Node.js, Express, MongoDB, SQLite, JWT</li>
                <li><strong>Mobile:</strong> React Native, Expo, TypeScript, React Navigation</li>
                <li><strong>Documentación:</strong> JSDoc</li>
            </ul>

            <h3>📖 Uso de la Documentación</h3>
            <p>
                Esta documentación ha sido generada automáticamente a partir del código fuente utilizando JSDoc.
                Cada módulo contiene información detallada sobre:
            </p>
            <ul>
                <li>Funciones, clases y componentes disponibles</li>
                <li>Parámetros requeridos y opcionales</li>
                <li>Tipos de datos y valores de retorno</li>
                <li>Ejemplos de uso cuando están disponibles</li>
                <li>Dependencias y relaciones entre módulos</li>
            </ul>

            <h3>🔄 Actualización de la Documentación</h3>
            <p>
                Para regenerar esta documentación después de realizar cambios en el código, ejecuta:
            </p>
            <p style="background: #f5f5f5; padding: 15px; border-radius: 8px; font-family: monospace;">
                node generate_jsdoc_web_backend.js
            </p>
        </div>

        <div class="footer">
            <p>📚 Documentación generada con JSDoc</p>
            <p>888 Cargo © ${new Date().getFullYear()}</p>
        </div>
    </div>
</body>
</html>`;

    fs.writeFileSync(indexPath, htmlContent, "utf8");
    console.log("✅ Página índice mejorada generada\n");
  }

  /**
   * Ejecuta el proceso completo
   */
  async run() {
    console.log(
      "\n======================================================================"
    );
    console.log("  888CARGO - GENERADOR DE DOCUMENTACIÓN TypeDoc");
    console.log("  (Web + Backend + Mobile)");
    console.log(
      "======================================================================\n"
    );

    // Verificar TypeDoc
    if (!this.checkTypeDoc()) {
      return;
    }

    // Crear directorios
    this.createDirectories();

    console.log("🚀 Generando documentación del código\n");
    console.log(
      "======================================================================\n"
    );

    const results = {};

    // Generar documentación para cada proyecto
    for (const [key, project] of Object.entries(this.projects)) {
      results[key] = await this.generateDocs(key, project);
    }

    // Actualizar índice
    this.updateIndexPage();

    // Resumen final
    console.log(
      "======================================================================"
    );
    console.log("✅ PROCESO COMPLETADO");
    console.log(
      "======================================================================\n"
    );
    console.log(`📁 Ubicación: ${this.docsOutput}`);
    console.log(`🌐 Índice: ${path.join(this.docsOutput, "index.html")}\n`);
    console.log("📊 Resultados:");

    for (const [key, success] of Object.entries(results)) {
      const project = this.projects[key];
      console.log(
        `   ${success ? "✅" : "⚠️"} ${project.name}: ${
          success ? "Generada" : "Con errores"
        }`
      );
    }

    console.log("\n🌐 Abriendo documentación...");

    try {
      execSync(`explorer "${path.join(this.docsOutput, "index.html")}"`, {
        stdio: "ignore",
      });
    } catch (error) {
      // Ignorar error si no se puede abrir el explorador
    }
  }
}

// Ejecutar
const generator = new JSDocGenerator();
generator.run().catch(console.error);
