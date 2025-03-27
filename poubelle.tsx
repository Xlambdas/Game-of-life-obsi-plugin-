// --- | Test parents /enfants | ---

import { useRef, forwardRef, useImperativeHandle } from "react";

const ChildComponent = (contentEl: HTMLElement) => {
	contentEl.createEl("p", { text: 'This is a child component' });
};

const ParentModal = class extends Modal {

	constructor(app: App) {
		super(app);

	}

	onOpen() {
		const { contentEl } = this;
		// contentEl.createEl("h2", { text: 'Parent Modal' });
		// contentEl.createEl("p", { text: 'This is a parent modal with a child component' });
		// const button = contentEl.createEl("button", { text: 'Open Child Component', cls: 'mod-cta' });
		// button.addEventListener('click', () => Parent());
		// ChildComponent(contentEl);
		const root = createRoot(contentEl);

		// root.render(<MyModalContent onClose={() => this.close()} externalFunction={()=> alert("caca")} />);
		root.render(<ParentA />);
	}

	onClose() {
		this.contentEl.empty();
	}
}

const Enfant = ({ envoyerData }: { envoyerData: (data: string) => void }) => {
	return <button onClick={() => envoyerData("Données de l’enfant")}>Envoyer</button>;
  };

const EnfantZ = ({ afficherData }: { afficherData: () => void }) => {
	return <button onClick={afficherData}>Afficher</button>;
  }

const Parent = () => {

	const handleClicker = () => {alert("Message du parent !");};
	const recevoirData = (data: string) => {
		console.log("Reçu du fils :", data);
	};
	
	return (
		<div>
			<h2>Parent</h2>
			<EnfantZ afficherData={handleClicker} />
			<Enfant envoyerData={recevoirData} />
		</div>);
  };
  


export const MyModalContent = forwardRef(({ onClose, externalFunction }: { onClose: () => void; externalFunction: () => void; }, ref) => {

	const [message, setMessage] = useState("Cliquez pour tester");

	const sayHello = () => {
		setMessage("Hello depuis le modal, id = " + Math.random());
	};

	useImperativeHandle(ref, () => ({ sayHello, }));

  
	return (
	  <div>
		<Parent />
		<h2>Test Modal</h2>
		<p>{message}</p>
		<button onClick={sayHello}>{message}</button>
		<button onClick={onClose}>Fermer</button>
		<ParentZ />
		<button onClick={externalFunction}>Appeler fonction externe</button>
		{/* <ParentY /> */}
	  </div>
	);
  });



// const Enfants = forwardRef((props, ref) => {
// 	useImperativeHandle(ref, () => ({
// 	  direBonjour: () => alert("Bonjour du composant Enfant !"),
// 	}));
  
// 	return <p>Je suis l’enfant</p>;
//   });
  
// const Parents = () => {
// 	const enfantRef = useRef<{ direBonjour: () => void }>(null);
  
// 	return (
// 	  <>
// 		<button onClick={() => enfantRef.current?.direBonjour()}>
// 		  Appeler la fonction de l’enfant
// 		</button>
// 		<Enfants ref={enfantRef} />
// 	  </>
// 	);
//   };



const Child = forwardRef((props, ref) => {
  useImperativeHandle(ref, () => ({
	sayHello: () => alert("Hello from Child!"),
  }));

  return <div>Child Component</div>;
});

const ParentZ = () => {
  const childRef = useRef<{ sayHello: () => void }>(null);

  return (
	<div>
	  <button onClick={() => childRef.current?.sayHello()}>Call Child</button>
	  <Child ref={childRef} />
	</div>
  );
};


// class sidebarRPG extends ItemView {
// 	// const { workspace} = this.app;
	
// 	constructor(leaf: WorkspaceLeaf) {
// 		super(leaf);
// 	}

// 	getViewType(): string {
// 		return "my-view";
// 	}

// 	getDisplayText(): string {
// 		return "Panneau interactif";
// 	}

// 	async onOpen() {
// 		console.log("open leaf (sidebarRPG)")
// 		const container = this.containerEl.children[1];
// 		container.empty();

// 		const root = createRoot(container);
// 		root.render(<Component />)
// 	}

// 	async onClose() {
// 		this.containerEl.empty();
// 	}
// }






interface ComponentProps {
	app: App;
}

const Component: React.FC<ComponentProps> = ({ app }) => {
	const [user, setUser] = React.useState(userData);
	const [xp, setXp] = React.useState(user.user1.persona.xp);
	// const filePath = "data/user.json";
	console.log("user", user);

	return (
		<div style={{ padding: "10px", color: "white", background: "black" }}>
			<h2>Panneau interactif</h2>
			<p>Ceci est une interface React dans Obsidian.</p>
			<p>XP : {xp}</p>
			<button onClick={() => setXp(xp + 10)}>Augmenter XP</button>
			<button
				onClick={async () => {
					setXp(xp + 10);
					user.user1.persona.xp = xp;

					const path = `${app.vault.configDir}/plugins/game-of-life/data/user.json`;
					console.log("path", path);
					await app.vault.adapter.write(path, JSON.stringify(user, null, 2));
					console.log("Données sauvegardées !");
				}}
			>
				Sauvegarder
			</button>
		</div>
	);
};



export const ParentA = () => {
  const [count, setCount] = useState(0);

  const sayHello = () => {
	alert("Hello depuis le Parent !");
  };

  const increment = () => {
	setCount((prev) => prev + 1);
  };

  const reset = () => {
	setCount(0);
  };

  const parentFunctions = { sayHello, increment, reset };

  return (
	<div>
	  <h2>Parent</h2>
	  <p>Compteur : {count}</p>
	  <button onClick={sayHello}>Dire Bonjour</button>
	  <button onClick={increment}>Incrémenter</button>
	  <button onClick={reset}>Réinitialiser</button>

	  {/* Passer toutes les fonctions au composant enfant */}
	  <ModalTest onClose={() => {}} parentFunctions={parentFunctions} />
	</div>
  );
};
