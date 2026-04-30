'use strict';

// ── Note utilisateur ──────────────────────────────────────────────────────────

function getUserNote(bottle) {
  const notes = [];
  if (bottle.notePerso?.note) notes.push(bottle.notePerso.note);
  if (bottle.notes?.length) {
    const avg = bottle.notes.reduce((s, n) => s + n.note, 0) / bottle.notes.length;
    notes.push(avg);
  }
  if (!notes.length) return null;
  return Math.round((notes.reduce((s, n) => s + n, 0) / notes.length) * 10) / 10;
}

// ── Normalisation ─────────────────────────────────────────────────────────────

function normalizeStr(s) {
  return (s ?? '')
    .replace(/œ/g, 'oe').replace(/æ/g, 'ae')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

// ── Identité produit ──────────────────────────────────────────────────────────

function metaScore(b) {
  return (b.region ? 1 : 0) + (b.appellation ? 1 : 0) + (b.cepage ? 1 : 0) + (b.couleur ? 1 : 0);
}

function selectBetter(a, b) {
  if (a.quantite !== b.quantite) return a.quantite > b.quantite ? a : b;
  const aN = getUserNote(a) ?? 0, bN = getUserNote(b) ?? 0;
  if (aN !== bN) return aN > bN ? a : b;
  if (a.isFavorite !== b.isFavorite) return a.isFavorite ? a : b;
  return metaScore(a) >= metaScore(b) ? a : b;
}

function groupBottles(bottles) {
  // Niveau 1 : grouper par nom normalisé + millésime + format
  const level1 = new Map();
  for (const b of bottles) {
    const key = normalizeStr(b.nom) + '\0' + String(b.annee ?? '') + '\0' + normalizeStr(b.format);
    const arr = level1.get(key) ?? [];
    arr.push(b);
    level1.set(key, arr);
  }

  const result = [];

  for (const group of level1.values()) {
    if (group.length === 1) {
      result.push({ representative: group[0], allOccurrences: [group[0]], totalQty: group[0].quantite });
      continue;
    }

    // Niveau 2 : séparer avec / sans producteur
    const withProd = new Map();
    const withoutProd = [];

    for (const b of group) {
      const prod = normalizeStr(b.producteur);
      if (prod) {
        const arr = withProd.get(prod) ?? [];
        arr.push(b);
        withProd.set(prod, arr);
      } else {
        withoutProd.push(b);
      }
    }

    if (withProd.size > 0) {
      const prodGroups = [...withProd.values()].map(bottles => ({
        representative: bottles.reduce((a, b) => selectBetter(a, b)),
        allOccurrences: [...bottles],
      }));

      if (withoutProd.length > 0) {
        let bestIdx = 0;
        for (let i = 1; i < prodGroups.length; i++) {
          if (selectBetter(prodGroups[i].representative, prodGroups[bestIdx].representative) === prodGroups[i].representative) {
            bestIdx = i;
          }
        }
        const best = prodGroups[bestIdx];
        best.allOccurrences.push(...withoutProd);
        for (const b of withoutProd) {
          if (selectBetter(b, best.representative) === b) best.representative = b;
        }
      }

      for (const g of prodGroups) {
        result.push({
          representative: g.representative,
          allOccurrences: g.allOccurrences,
          totalQty: g.allOccurrences.reduce((s, b) => s + b.quantite, 0),
        });
      }
    } else {
      result.push({
        representative: withoutProd.reduce((a, b) => selectBetter(a, b)),
        allOccurrences: withoutProd,
        totalQty: withoutProd.reduce((s, b) => s + b.quantite, 0),
      });
    }
  }

  return result;
}

// ── Score d'un groupe contre un accord mets-vins ──────────────────────────────

function scoreGroup(g, pairing) {
  const bottle = g.representative;
  const couleur = (bottle.couleur ?? '').toLowerCase().trim();
  const region  = (bottle.region  ?? '').toLowerCase().trim();
  const factors = [];
  let caveat;
  let baseScore = 0;
  let match;

  // 1. Accord couleur
  if (pairing.ideal.couleurs.includes(couleur)) {
    baseScore = 55;
    match     = 'ideal';
    factors.push('Accord classique avec ce plat');
    if (pairing.ideal.regionsPreferees?.length) {
      const pref = pairing.ideal.regionsPreferees.some(r =>
        region.includes(r.toLowerCase()) || r.toLowerCase().includes(region)
      );
      if (pref && region) { baseScore += 12; factors.push(`Région recommandée (${bottle.region})`); }
    }
    if (pairing.regionsBonus?.length) {
      for (const rb of pairing.regionsBonus) {
        const pat = rb.pattern.toLowerCase();
        if (region.includes(pat) || (bottle.appellation ?? '').toLowerCase().includes(pat)) {
          baseScore += rb.bonus;
          factors.push(`Appellation idéale (${rb.pattern})`);
          break;
        }
      }
    }
  } else if (pairing.bon.couleurs.includes(couleur)) {
    baseScore = 28; match = 'bon';
  } else if (pairing.acceptable.couleurs.includes(couleur)) {
    baseScore = 16; match = 'compromis';
    caveat = `${pairing.texteCompromis} ${pairing.texteAchat}`;
  } else {
    baseScore = 6; match = 'compromis';
    caveat = pairing.eviter.raison
      ? `${pairing.eviter.raison} ${pairing.texteAchat}`
      : `Ce ${couleur} n'est pas recommandé ici. ${pairing.texteAchat}`;
  }

  // 2. Bonus note utilisateur (+0-20)
  const userNote = getUserNote(bottle);
  if (userNote !== null) {
    const noteBonus = Math.round((userNote / 5) * 20);
    baseScore += noteBonus;
    if (userNote >= 4.5)      factors.push(`Coup de cœur (${userNote.toFixed(1)}/5)`);
    else if (userNote >= 4)   factors.push(`Très bien noté (${userNote.toFixed(1)}/5)`);
    else if (userNote >= 3)   factors.push(`Bien noté (${userNote.toFixed(1)}/5)`);
  }

  // 3. Bonus maturité (+0-15)
  const currentYear = new Date().getFullYear();
  if (bottle.consommerAvant) {
    const yearsLeft = bottle.consommerAvant - currentYear;
    if (yearsLeft >= 0 && yearsLeft <= 2)      { baseScore += 15; factors.push('À maturité optimale'); }
    else if (yearsLeft > 2 && yearsLeft <= 5)  { baseScore += 8; }
    else if (yearsLeft < 0)                    { baseScore += 2; factors.push('Dépasse la garde recommandée'); }
  }

  // 4. Bonus stock agrégé toutes caves (+5)
  if (g.totalQty >= 2) baseScore += 5;

  // 5. Bonus favori (+5)
  if (bottle.isFavorite) { baseScore += 5; factors.push('Favori'); }

  const finalScore  = Math.min(Math.round(baseScore), 100);
  const explanation = match === 'ideal' ? pairing.texteIdeal
                    : match === 'bon'   ? pairing.texteBon
                    : pairing.texteCompromis;

  return { score: finalScore, match, explanation, factors, caveat };
}

module.exports = { getUserNote, groupBottles, scoreGroup };
