import * as React from "react";
import styles from "./HelpView.module.scss";

export interface IHelpViewProps {
  isAdmin: boolean;
}

const HelpView: React.FC<IHelpViewProps> = ({ isAdmin }) => (
  <div className={styles.help}>
    <h2 className={styles.titel}>Uitleg</h2>
    <p className={styles.intro}>
      Deze app helpt je een werkvorm te vinden en daarmee een bouwplan voor je sessie te
      bouwen. Hieronder staat wat er allemaal kan — en net zo belangrijk: wat er (nog) niet
      kan, zodat je niet gaat zoeken naar iets dat er niet is.
    </p>

    {/* ------------------------------------------------------------------ */}
    <section className={styles.sectie}>
      <h3 className={styles.kop}>Werkvormen vinden</h3>
      <p>
        De bibliotheek bevat 34 gecureerde werkvormen: Liberating Structures, energizers,
        ijsbrekers, en vormen voor divergeren, convergeren, besluitvorming en reflectie. Elke
        werkvorm heeft een doel, een volledig stappenplan, benodigde materialen, de duur, de
        geschikte groepsgrootte en tips voor de facilitator.
      </p>
      <ul className={styles.lijst}>
        <li>
          <strong>Zoeken</strong> doorzoekt de titel, beschrijving, het doel, de tags én de
          materialen. Zoek je op &quot;post-its&quot;, dan krijg je alles waar je post-its
          voor nodig hebt.
        </li>
        <li>
          <strong>Filteren</strong> kan op categorie, fase van de sessie, doel, of het online,
          hybride of fysiek werkt, tijdsduur en groepsgrootte. Filters stapelen: kies je twee
          categorieën, dan zie je werkvormen uit allebei.
        </li>
        <li>
          <strong>Favorieten</strong> zet je met het hartje. Die horen bij je account, dus je
          vindt ze terug op elk apparaat waarop je inlogt.
        </li>
      </ul>
    </section>

    {/* ------------------------------------------------------------------ */}
    <section className={styles.sectie}>
      <h3 className={styles.kop}>Bouwplannen maken</h3>
      <p>
        De bouwplanner volgt de officiële Morgens-bouwplantemplate: gegevens van de
        bijeenkomst, voorbereiding, de agenda en nazorg.
      </p>
      <ul className={styles.lijst}>
        <li>
          <strong>Een werkvorm koppelen</strong> aan een agendapunt vult automatisch het
          onderwerp, de aanpak, het materiaal en de eindtijd in. Dat scheelt overtypen en
          voorkomt fouten in de tijdsplanning.
        </li>
        <li>
          <strong>Volgorde wijzigen</strong> kan met slepen of met de pijltjes. Met{" "}
          <em>Tijden doorschuiven</em> vult de app alle tijden aaneensluitend vanaf de eerste
          starttijd — handig als je halverwege een punt toevoegt.
        </li>
        <li>
          <strong>Het materiaaloverzicht</strong> verzamelt automatisch alles wat je nodig
          hebt, over alle onderdelen heen.
        </li>
        <li>
          <strong>Word-export</strong> levert een document in de Morgens-huisstijl, precies
          volgens de template. Dat bestand kun je delen, mailen en bewaren.
        </li>
      </ul>
      <p className={styles.nadruk}>
        Je bouwplannen zijn privé. Alleen jij ziet ze — beheerders ook niet.
      </p>
    </section>

    {/* ------------------------------------------------------------------ */}
    <section className={styles.sectie}>
      <h3 className={styles.kop}>Inspiratie</h3>
      <p>
        Hier deel je met collega&apos;s wat je hebt geprobeerd. Een bericht is een{" "}
        <em>Ervaring</em>, een <em>Tip</em> of een <em>Bouwplan</em>, en je kunt er werkvormen
        aan koppelen zodat lezers meteen kunnen doorklikken.
      </p>
      <ul className={styles.lijst}>
        <li>Reageren kan op een bericht én op andere reacties, zodat er een gesprek ontstaat.</li>
        <li>
          Met de emoji-knop reageer je kort. Klik je nog een keer op je eigen emoji, dan neem
          je hem terug.
        </li>
        <li>Je eigen bericht of reactie kun je zelf verwijderen.</li>
      </ul>
      <p>
        Anders dan je bouwplannen is dit <strong>wel</strong> zichtbaar voor alle collega&apos;s,
        met je naam erbij.
      </p>
    </section>

    {/* ------------------------------------------------------------------ */}
    <section className={styles.sectie}>
      <h3 className={styles.kop}>Een werkvorm voorstellen</h3>
      <p>
        Mis je een werkvorm? Via <em>Nieuwe werkvorm</em> vul je hem in en stuur je hem door.
        Een beheerder bekijkt het voorstel en zet hem in de bibliotheek, eventueel na een
        redactieslag. Je kunt er een afbeelding bij uploaden.
      </p>
      <p>
        Je voorstel staat dus niet meteen in de bibliotheek — dat is bewust, zodat de
        verzameling gecureerd blijft.
      </p>
    </section>

    {/* ------------------------------------------------------------------ */}
    {isAdmin && (
      <section className={`${styles.sectie} ${styles.beheer}`}>
        <h3 className={styles.kop}>Voor beheerders</h3>
        <ul className={styles.lijst}>
          <li>
            <strong>Werkvormen bewerken en verwijderen</strong> via de knoppen in het
            detailvenster. Wijzigingen gelden meteen voor iedereen.
          </li>
          <li>
            <strong>Voorstellen beoordelen</strong> bovenaan het beheerscherm. Goedkeuren zet
            de werkvorm direct in de bibliotheek.
          </li>
          <li>
            <strong>Collega&apos;s tot beheerder maken</strong> in de gebruikerslijst. De
            laatste beheerder kan zichzelf niet degraderen — anders kan niemand het meer
            terugdraaien.
          </li>
          <li>
            <strong>Inspiratieberichten verwijderen</strong> van iedereen, niet alleen je
            eigen.
          </li>
        </ul>
        <p className={styles.nadruk}>
          Verwijderen is definitief. Er is geen prullenbak en geen versiegeschiedenis.
        </p>
      </section>
    )}

    {/* ------------------------------------------------------------------ */}
    <section className={styles.sectie}>
      <h3 className={styles.kop}>Wat er (nog) niet kan</h3>
      <p>
        Eerlijk overzicht, zodat je niet zoekt naar iets dat er niet is:
      </p>
      <ul className={styles.lijst}>
        <li>
          <strong>Geen AI-adviseur.</strong> Die tab is er bewust uit gehaald; de app doet op
          dit moment niets met AI.
        </li>
        <li>
          <strong>Een bouwplan delen met een collega kan niet.</strong> Wel exporteren naar
          Word en dat bestand doorsturen.
        </li>
        <li>
          <strong>Geen prullenbak.</strong> Een verwijderd bouwplan, bericht of reactie is
          echt weg.
        </li>
        <li>
          <strong>Geen meldingen.</strong> Je krijgt geen bericht als iemand op je
          inspiratiebericht reageert — je ziet het als je gaat kijken.
        </li>
        <li>
          <strong>Niet gemaakt voor een telefoon.</strong> De app is gebouwd voor een laptop-
          of desktopscherm. Op een klein scherm moet je horizontaal scrollen.
        </li>
        <li>
          <strong>Geen zoekfunctie binnen Inspiratie.</strong> Je kunt wel filteren op type.
        </li>
      </ul>
    </section>

    {/* ------------------------------------------------------------------ */}
    <section className={styles.sectie}>
      <h3 className={styles.kop}>Inloggen en je account</h3>
      <ul className={styles.lijst}>
        <li>
          Registreren kan alleen met een <strong>@morgens.nl</strong>-adres. Je krijgt een
          bevestigingsmail; die komt van Supabase en niet van Morgens, dus{" "}
          <strong>kijk ook in je ongewenste post</strong>.
        </li>
        <li>
          Er kunnen <strong>maximaal twee van die mails per uur</strong> verstuurd worden voor
          de hele organisatie. Krijg je niets, probeer het dan later opnieuw of vraag Munzur om
          je account met de hand te bevestigen.
        </li>
        <li>
          <em>Ingelogd blijven</em> op het inlogscherm staat standaard aan. Zet het uit op een
          geleende of gedeelde laptop — dan word je uitgelogd zodra je de browser sluit.
        </li>
        <li>Wachtwoord vergeten verloopt via dezelfde mail, dus met dezelfde limiet.</li>
      </ul>
    </section>

    {/* ------------------------------------------------------------------ */}
    <section className={styles.sectie}>
      <h3 className={styles.kop}>Waar je gegevens staan</h3>
      <p>
        De app draait op Cloudflare en de gegevens staan in een database van Supabase, in
        Ierland — dus binnen de EU, maar <strong>buiten de Microsoft-omgeving van Conclusion</strong>.
        Dat is goed om te weten wanneer je klantnamen of vertrouwelijke sessiedoelen in een
        bouwplan zet.
      </p>
      <p className={styles.nadruk}>
        Er is nog geen automatische back-up. Bewaar een bouwplan waar je lang aan hebt gewerkt
        daarom ook als Word-export — dat bestand staat dan op je eigen schijf.
      </p>
    </section>

    {/* ------------------------------------------------------------------ */}
    <section className={styles.sectie}>
      <h3 className={styles.kop}>Iets kapot of een wens?</h3>
      <p>
        De app is in ontwikkeling en wordt onderhouden door Munzur Atak. Loop je tegen iets
        aan, of mis je iets? Laat het weten — juist tijdens deze eerste periode is dat
        waardevol.
      </p>
    </section>
  </div>
);

export default HelpView;
