import { ArrowLeft } from 'lucide-react';

export function LegalPage({ onBack }: { onBack: () => void }) {
  return (
    <main className="app-shell legal-page">
      <header className="topbar">
        <button className="secondary" onClick={onBack}><ArrowLeft size={18}/> Itzuli</button>
        <div><h1>Base legala eta pribatutasuna</h1><p>Datuen erabilerari buruzko oinarrizko informazioa.</p></div>
      </header>
      <section className="panel readable">
        <h2>Aplikazioaren xedea</h2>
        <p>Irakaslearen Kuadernoa irakasleek beren jarduera akademiko arrunta kudeatzeko tresna da: klaseak, ikasleak, ebaluazio tresnak, kalifikazioak, konpetentziak eta ebaluazio irizpideak.</p>
        <h2>Erabil daitezkeen datuak</h2>
        <ul><li>Ikasleen izen-abizenak.</li><li>Klasea, maila eta irakasgaia.</li><li>Kalifikazioak, konpetentzia espezifikoak eta ebaluazio irizpideak.</li><li>Ikaskuntzarekin lotutako ohar akademiko arruntak.</li></ul>
        <h2>Ez igo datu bereziki sentikorrik</h2>
        <p>Aplikazioa ez dago diseinatuta osasunari, diagnostikoei, egoera psikologikoari, familia egoera delikatuei, babes neurriak dituzten egoerei, datu judizialei, erlijioari edo ideologiari buruzko informazioa gordetzeko.</p>
        <h2>Erabiltzailearen erantzukizuna</h2>
        <p>Erabiltzaile bakoitzak bermatu behar du sartzen dituen datuak bere jarduera profesionalerako beharrezkoak direla eta datuen babesari buruzko araudia betetzen dutela.</p>
      </section>
    </main>
  );
}
