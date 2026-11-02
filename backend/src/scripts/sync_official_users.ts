import 'dotenv/config';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { neon } from '@neondatabase/serverless';

const rawData = `1,2026-09-20,SENIOR,german.cornejowong@gmail.com,Hardman-418270!,-,-,
2,2026-09-20,SENIOR,marcoanto8810@gmail.com,Hardman-192433!,-,-,
3,2026-09-20,SENIOR,manuel.moreno.cardozo@hotmail.com,Hardman-676659!,-,-,
4,2026-09-20,SENIOR,manuestudiolegal@gmail.com,Hardman-450614!,-,-,
5,2026-09-20,JUNIOR,fernandoramosrojas4@gmail.com,Hardman-534802!,-,-,
6,2026-09-20,SENIOR,rodrigo021089@gmail.com,Hardman-915856!,-,-,
7,2026-09-20,SENIOR,perseofenix23@gmail.com,Hardman-717501!,-,-,
8,2026-10-21,JUNIOR,zevallosmantari@gmail.com,Hardman-714210!,Olme Zevallos Mantari,HP4090439278,
9,2026-09-20,SENIOR,lguivinp@gmail.com,Hardman-736112!,-,-,
10,2026-09-20,SENIOR,brisetprado@gmail.com,Hardman-758845!,-,-,
11,2026-09-20,SENIOR,gmanuel1623@gmail.com,Hardman-645506!,-,-,
12,2026-09-20,SENIOR,bradynoguera20@gmail.com,Hardman-411253!,-,-,
13,2026-09-20,SENIOR,callirgosmr14@gmail.com,Hardman-558707!,-,-,
14,2026-09-20,SENIOR,dalexbarrientos@gmail.com,Hardman-528473!,-,-,
15,2026-09-20,JUNIOR,aramiscatillo@gmail.com,Hardman-170528!,-,-,
16,2026-09-20,SENIOR,eparihuanacard@gmail.com,Hardman-363708!,-,-,
17,2026-10-27,JUNIOR,oruizv@outlook.com,Hardman-477234!,Oscar Ruiz Vera,HP0417063096,
18,2026-09-20,SENIOR,oblitaslorenzo1710@gmail.com,Hardman-960503!,-,-,
19,2026-09-20,JUNIOR,asdis20mx3@gmail.com,Hardman-157527!,-,-,
20,2026-09-20,SENIOR,consensusfirmalegal@gmail.com,Hardman-155725!,-,-,
21,2026-09-20,SENIOR,ablas@blaslegal.com,Hardman-554288!,-,-,
22,2026-09-20,SENIOR,emmeline_rp3@hotmail.com,Hardman-495991!,-,-,
23,2026-09-20,SENIOR,nnoblecilla12@gmail.com,Hardman-172594!,-,-,
24,2026-09-20,JUNIOR,gerardoalbarran033@gmail.com,Hardman-466378!,-,-,
25,2026-09-20,SENIOR,eduardo_mxp@hotmail.com,Hardman-545366!,-,-,
26,2026-09-20,JUNIOR,estudiojuridicoalejandroflores@gmail.com,Hardman-623485!,-,-,
27,2026-09-20,SENIOR,abogadoburga@gmail.com,Hardman-585659!,-,-,
28,2026-09-20,SENIOR,fernandezhabogados@gmail.com,Hardman-853598!,-,-,
29,2026-09-20,JUNIOR,abogadoconsultorasesor@gmail.com,Hardman-590661!,-,-,
30,2026-09-20,SENIOR,miguelcervantes2299@gmail.com,Hardman-694785!,-,-,
31,2026-09-20,JUNIOR,sandroventuri21@gmail.com,Hardman-675685!,-,-,
32,2026-09-21,JUNIOR,irmasugei5@gmail.com,Hardman-115378!,-,-,
33,2026-09-20,JUNIOR,dennisvmq@gmail.com,Hardman-663222!,-,-,
34,2026-09-21,SENIOR,abg.anccasitapia@gmail.com,Hardman-455859!,-,-,
35,2026-09-21,SENIOR,luissandovalch@gmail.com,Hardman-737239!,Luis Alberto Sandoval Chavez,HP1305919093,
36,2026-09-22,SENIOR,lesly.barturenjulca@gmail.com,Hardman-747676!,Lesly Melissa Barturen Julca,HP2646658452,
37,2026-09-22,JUNIOR,jenniferaragoncastro@gmail.com,Hardman-103909!,Jennifer Aragon,HP3131826815,
38,2026-09-22,SENIOR,elmerprovincia1@gmail.com,Hardman-847520!,Elmer Provincia Apaza,HP2327010381,
39,2026-09-23,SENIOR,ingjcaso@gmail.com,Hardman-512893!,Jimmy Caso,HP2212738313,
40,2026-09-24,SENIOR,majeabogados@gmail.com,Hardman-326164!,Jose Luis Chayan Ñique,HP1735663881,
41,2026-09-25,SENIOR,lizvanyrojasabogada@gmail.com,Hardman-990846!,Bertha Lizvany Rojas Shupingahua,HP3181058229,
42,2026-10-26,SENIOR,jrejanoanchi@gmail.com,Hardman-294971!,Jaime Fredy Anchi Rejano,HP3463414660,
43,2026-09-29,JUNIOR,effiosalazarroberto@gmail.com,Hardman-897787!,Roberto Carlos,HP1204207990,
44,2026-09-30,JUNIOR,abog.gonzalesr@gmail.com,Hardman-584460!,Claudia Valeria Gonzales Rojas,HP1304333004,
45,2026-10-30,SENIOR,marjasersa@gmail.com,Hardman-625969!,Martín Javier Sernaque Saavedra,HP2168771838,
46,2026-11-01,SENIOR,israeljackson3103@gmail.com,Hardman-953371!,Israel Jackson Carbajal Bautista,HP2326364001,
47,2026-10-02,SENIOR,ezequiel12rf@gmail.com,Hardman-382292!,Ezequiel Damian Inga,HP1054154798,
48,2026-10-04,JUNIOR,fenixsl2018@gmail.com,Hardman-472693!,Felix Moises Sandoval Lujan,HP3377667085,
49,2026-10-09,JUNIOR,lcruzado100@hotmail.com,Hardman-712396!,Luis Alberto Cruzado Eulogio,HP0948180284,
50,2026-10-09,JUNIOR,gabriel.mateus.yt@gmail.com,Hardman-918281!,Gabriel Mateus,HP2221714468,
51,2026-10-14,SENIOR,salgadodpenal@gmail.com,Hardman-404816!,Cristian David Sanchez Salgado,HP2259474579,
52,2026-10-15,SENIOR,luiselfern@gmail.com,Hardman-363606!,Luis Nuñez Saavedra,HP0317721856,
53,2026-10-15,JUNIOR,jorgemanuelfernandoo@gmail.com,Hardman-702581!,Fernando Efrain Rojas Osorio,HP2481827150,
54,2026-10-16,JUNIOR,notificacionesyanceasociados@gmail.com,Hardman-369523!,Jason Yance,HP0739360678,
55,2026-10-18,JUNIOR,dianyr30@gmail.com,Hardman-348000!,Lady Diana Romero Rodriguez,HP4253284418,
56,2026-10-19,JUNIOR,jeantrueno46@gmail.com,Hardman-735253!,Jax Fix,HP3148040914,
57,2026-10-19,SENIOR,albertomj1473@gmail.com,Hardman-998354!,alberto mj,HP0189904191,
58,2026-10-21,JUNIOR,legal.ogemillenium@gmail.com,Hardman-490045!,Charlie John Flores Torres,HP2157155965,
59,2026-10-23,SENIOR,luchito03.vite@gmail.com,Hardman-765781!,Luis Villarroel Tello,HP3402625381,
60,2026-10-24,SENIOR,terryojeda5@gmail.com,Hardman-474156!,Terry Ojeda,HP0949005024,
61,2026-10-24,SENIOR,jpurhuayacondo@gmail.com,Hardman-213660!,Julio Martin Purhuaya Condo,HP3974760675,
62,2026-10-25,JUNIOR,santiagojhony06@gmail.com,Hardman-993181!,Jhony Miguel Santiago Caja,HP2310845920,
63,2026-10-25,JUNIOR,daphnyllanos@gmail.com,Hardman-633062!,Daphny Llanos Cruces,HP4149991635,
64,2026-10-25,JUNIOR,fredyalfredofloreszirena@gmail.com,Hardman-939375!,Fredy Alfredo Flores Zirena,HP3022570089,
65,2026-10-25,JUNIOR,karen.verasuarez22@gmail.com,Hardman-330757!,Karen Vera,HP2307721957,
66,2026-10-25,JUNIOR,verdiabogados@gmail.com,Hardman-955987!,REMIGIO CCERHUAYO VERDI,HP3863874727,
67,2026-10-26,SENIOR,lapzabogados@gmail.com,Hardman-728888!,Luis Alberto Puente Zúñiga,HP1782599360,
68,2026-10-26,SENIOR,markogol43@gmail.com,Hardman-817551!,Marco Catacora,HP1017641926,
69,2026-10-26,SENIOR,luiscaceresh1010@gmail.com,Hardman-805499!,Jose Luis Caceres Haro,HP2730452608,
70,2026-10-26,JUNIOR,abogadamaria0@gmail.com,Hardman-473740!,María del Rosario Rodríguez Alarcón,HP1706266360,
71,2026-10-26,SENIOR,alexandrachmoran@gmail.com,Hardman-855242!,Alexandra Chunga Morán,HP3806934058,
72,2026-10-27,SENIOR,maqc041065@gmail.com,Hardman-394253!,Marcos Quijano Cusque,HP0401565871,
73,2026-10-27,JUNIOR,victormunozcar@hotmail.com,Hardman-587002!,Victor Antonio Muñoz Carranza,HP2209085555,
74,2026-10-27,SENIOR,vargasasociadoslawyer@gmail.com,Hardman-966367!,Vargas Asociados,HP4165457091,
75,2026-10-27,JUNIOR,firmadeabogadospoma@gmail.com,Hardman-198254!,César Javier Poma Matos,HP2356767836,
76,2026-10-28,JUNIOR,edgardcc452@gmail.com,Hardman-112204!,Edgard Cayllahua Conde,HP4156146497,
77,2026-10-28,SENIOR,erjarugu@gmail.com,Hardman-515359!,Erick Jabes Rubina Guzmán,HP4024608346,
78,2026-10-28,JUNIOR,cesar33552@gmail.com,Hardman-536636!,Cesarone Laura Canales,HP2858078684,
79,2026-10-28,SENIOR,josue.cuso13@gmail.com,Hardman-902368!,Abelardo Josue Pashanase Cuso,HP1601904174,
80,2026-10-29,SENIOR,jensonvizcarra2@gmail.com,Hardman-144740!,Jenson Vizcarra,HP1869597463,
81,2026-10-29,JUNIOR,reginasrodriguezs@gmail.com,Hardman-597929!,Regina Rodriguez,HP3305247207,
82,2026-10-29,SENIOR,ernestosoriah@gmail.com,Hardman-388321!,Ernesto Domingo Soria Huaracha,HP3526493149,
83,2026-10-29,JUNIOR,josemechatosopamayo@gmail.com,Hardman-672934!,Jose Mechato Sopamayo,HP3093265887,
84,2026-10-29,JUNIOR,preciadoedwin56@gmail.com,Hardman-856257!,Edwin Smith Preciado Martinez,HP0929422749,
85,2026-10-29,JUNIOR,ximel_0902@hotmail.com,Hardman-603737!,Ana Rojas,HP1118244158,
86,2026-10-29,SENIOR,merrimanaliagaperu@gmail.com,Hardman-889349!,Merriman Aliaga Bastias,HP1388828260,
87,2026-10-29,SENIOR,jjnunoncaq88@gmail.com,Hardman-900429!,Jourgoen Joel NUÑONCA QUISPE,HP4293175113,
88,2026-10-29,SENIOR,alecorp.hp@gmail.com,Hardman-712088!,Carlos Huayllani Peralta,HP1845818008,
89,2026-10-29,JUNIOR,napolitano_777@hotmail.com,Hardman-500688!,Daniel Vega Grimaldo,HP2082685413,
90,2026-10-29,SENIOR,psayan_18@hotmail.com,Hardman-399649!,Paolo Martín Sayán Guevara,HP2947231515,
91,2026-10-29,SENIOR,estudiominayaabogados@gmail.com,Hardman-244952!,Jesus Fernando Minaya Llerena,HP0651419504,
92,2026-10-29,SENIOR,rolandory@gmail.com,Hardman-901885!,Rolando Efrain Rojas Yaranga,HP0551000041,
93,2026-10-30,JUNIOR,cervantesabg@gmail.com,Hardman-721170!,Kevin Cervantes Diaz,HP0263925932,
94,2026-10-30,SENIOR,eluyoa@gmail.com,Hardman-745257!,Ernesto Luyo,HP4199583728,
95,2026-10-30,JUNIOR,nmichuy@gmail.com,Hardman-981581!,Nilton Aquiles Michuy Suyo,HP4130236981,
96,2026-10-31,SENIOR,sandovalcma@hotmail.com,Hardman-983255!,MIGUEL ANGEL SANDOVAL CARRANZA,HP3695637645,
97,2026-10-31,SENIOR,jonezpy@gmail.com,Hardman-173259!,Johnny Espinoza Raymundiz,HP1432159866,
98,2026-10-31,SENIOR,emmanuel.tdm2014@gmail.com,Hardman-115569!,Emmanuel Arturo Torres Fajardo,HP3097615261,
99,2026-11-01,JUNIOR,miguelugarteore@hotmail.com,Hardman-923717!,Miguel angel Ugarte ore,HP0249920086,
100,2026-11-01,JUNIOR,cintyadarnao@gmail.com,Hardman-218003!,Cintya Yrina marina acosta ortecho,HP0530630252,
101,2026-11-01,SENIOR,gerencia.teimpulsa@gmail.com,Hardman-348363!,JIM SALAS LEANDRO,HP3491688435,
102,2026-11-02,SENIOR,edgaraj70@gmail.com,Hardman-671964!,edgar pedro azorza jurado,HP2643395376,
103,2026-11-02,JUNIOR,m.paulinoquinto@gmail.com,Hardman-709055!,Frank Jhojan Mamani Cerron,HP3811877786,
104,2026-11-02,JUNIOR,jhonnaclari4@gmail.com,Hardman-504463!,Jhonn Aclari rojas,HP1184027474,
105,2026-11-02,SENIOR,earteagaca@arteagafirmalegal.com,Hardman-423579!,Enrique Camilo Arteaga Campos,HP2652659998,
106,2026-11-02,SENIOR,jose.albertobazanh@gmail.com,Hardman-540302!,JOSE BAZAN,HP3637617182,`;

const lines = rawData.trim().split('\n');
const parsed = lines.map((line) => {
  const parts = line.split(',');
  return {
    num: parseInt(parts[0], 10),
    regDate: parts[1].trim(), // YYYY-MM-DD
    plan: parts[2].trim().toLowerCase(), // senior / junior
    email: parts[3].trim().toLowerCase(),
    tempPass: parts[4].trim(),
    name: parts[5] && parts[5].trim() !== '-' ? parts[5].trim() : null,
    hotmartTx: parts[6] && parts[6].trim() !== '-' ? parts[6].trim() : null,
  };
});

const sql = neon(process.env.DATABASE_URL!);

async function syncUsers() {
  console.log(`Iniciando sincronización oficial de ${parsed.length} usuarios en Neon PostgreSQL...`);

  // Obtener usuarios existentes
  const existingUsers = await sql`SELECT id, email, name, password_hash, created_at FROM users`;
  const existingSubs = await sql`SELECT id, user_id, status, plan, hotmart_transaction, current_period_start, current_period_end FROM subscriptions`;

  const userMap = new Map();
  existingUsers.forEach((u) => userMap.set(u.email.toLowerCase(), u));

  const subMap = new Map();
  existingSubs.forEach((s) => subMap.set(s.user_id, s));

  let updatedCount = 0;
  let insertedCount = 0;

  for (const item of parsed) {
    const regTimestamp = new Date(`${item.regDate}T12:00:00.000Z`);
    // Vencimiento a 1 mes desde el inicio del período actual (o al menos 30 días posteriores al registro)
    const now = new Date();
    // Si el registro fue hace más de 30 días (ej. 2026-09-20), su período mensual activo va hasta noviembre o renovación
    let periodEnd = new Date(regTimestamp.getTime() + 30 * 24 * 60 * 60 * 1000);
    while (periodEnd < now) {
      periodEnd = new Date(periodEnd.getTime() + 30 * 24 * 60 * 60 * 1000);
    }
    const periodStart = new Date(periodEnd.getTime() - 30 * 24 * 60 * 60 * 1000);

    let dbUser = userMap.get(item.email);

    if (dbUser) {
      // 1. Actualizar usuario existente: created_at exacto, nombre si aplica
      const currentName = item.name || dbUser.name || null;
      await sql`
        UPDATE users
        SET created_at = ${regTimestamp.toISOString()},
            name = ${currentName}
        WHERE id = ${dbUser.id}
      `;

      // 2. Verificar o actualizar contraseña
      const passwordMatch = await bcrypt.compare(item.tempPass, dbUser.password_hash);
      if (!passwordMatch) {
        const newHash = await bcrypt.hash(item.tempPass, 12);
        await sql`UPDATE users SET password_hash = ${newHash} WHERE id = ${dbUser.id}`;
      }

      // 3. Actualizar o crear suscripción
      const existingSub = subMap.get(dbUser.id);
      if (existingSub) {
        await sql`
          UPDATE subscriptions
          SET plan = ${item.plan},
              status = 'active',
              hotmart_transaction = ${item.hotmartTx || existingSub.hotmart_transaction},
              current_period_start = ${periodStart.toISOString()},
              current_period_end = ${periodEnd.toISOString()},
              updated_at = NOW()
          WHERE id = ${existingSub.id}
        `;
      } else {
        await sql`
          INSERT INTO subscriptions (id, user_id, status, plan, hotmart_transaction, current_period_start, current_period_end)
          VALUES (${uuidv4()}, ${dbUser.id}, 'active', ${item.plan}, ${item.hotmartTx}, ${periodStart.toISOString()}, ${periodEnd.toISOString()})
        `;
      }
      updatedCount++;
    } else {
      // Usuario nuevo: crear usuario y suscripción
      const newUserId = uuidv4();
      const passwordHash = await bcrypt.hash(item.tempPass, 12);

      await sql`
        INSERT INTO users (id, email, password_hash, name, is_admin, created_at)
        VALUES (${newUserId}, ${item.email}, ${passwordHash}, ${item.name}, false, ${regTimestamp.toISOString()})
      `;

      await sql`
        INSERT INTO subscriptions (id, user_id, status, plan, hotmart_transaction, current_period_start, current_period_end)
        VALUES (${uuidv4()}, ${newUserId}, 'active', ${item.plan}, ${item.hotmartTx}, ${periodStart.toISOString()}, ${periodEnd.toISOString()})
      `;
      insertedCount++;
    }
  }

  console.log(`Sincronización completada exitosamente:`);
  console.log(`- ${updatedCount} usuarios actualizados en Neon con sus fechas, planes, nombres y Hotmart TX exactos.`);
  console.log(`- ${insertedCount} usuarios nuevos insertados.`);
}

syncUsers().catch(console.error);

