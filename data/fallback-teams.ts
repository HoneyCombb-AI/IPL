import type { AuctionTeam, IplTeam } from "@/lib/types";

type RawPlayer = {
  player_name: string;
  player_role?: string;
};

type RawTeam = {
  team_name: string;
  owner_name: string;
  players: RawPlayer[];
};

export const FALLBACK_IPL_TEAMS: IplTeam[] = [
  {
    id: "ipl-csk",
    name: "Chennai Super Kings",
    short_code: "CSK",
    primary_color: "#E9530D",
    secondary_color: "#2B5DA8",
  },
  {
    id: "ipl-dc",
    name: "Delhi Capitals",
    short_code: "DC",
    primary_color: "#2561AE",
    secondary_color: "#282968",
  },
  {
    id: "ipl-gt",
    name: "Gujarat Titans",
    short_code: "GT",
    primary_color: "#1B2133",
    secondary_color: "#DBBE6E",
  },
  {
    id: "ipl-kkr",
    name: "Kolkata Knight Riders",
    short_code: "KKR",
    primary_color: "#3A225D",
    secondary_color: "#F7D54E",
  },
  {
    id: "ipl-lsg",
    name: "Lucknow Super Giants",
    short_code: "LSG",
    primary_color: "#0057E2",
    secondary_color: "#F28B00",
  },
  {
    id: "ipl-mi",
    name: "Mumbai Indians",
    short_code: "MI",
    primary_color: "#004B8D",
    secondary_color: "#FFD141",
  },
  {
    id: "ipl-pbks",
    name: "Punjab Kings",
    short_code: "PBKS",
    primary_color: "#DD1F2D",
    secondary_color: "#F2D1A0",
  },
  {
    id: "ipl-rr",
    name: "Rajasthan Royals",
    short_code: "RR",
    primary_color: "#EA1A85",
    secondary_color: "#0E4D92",
  },
  {
    id: "ipl-rcb",
    name: "Royal Challengers Bengaluru",
    short_code: "RCB",
    primary_color: "#D71921",
    secondary_color: "#000000",
  },
  {
    id: "ipl-srh",
    name: "Sunrisers Hyderabad",
    short_code: "SRH",
    primary_color: "#EE7429",
    secondary_color: "#FCCB11",
  },
];

const IPL_TEAM_BY_CODE = new Map(FALLBACK_IPL_TEAMS.map((team) => [team.short_code, team]));

const rawTeamsByIpl: Record<string, RawTeam[]> = {
  CSK: [
    {
      team_name: "Ainesh",
      owner_name: "Ainesh",
      players: [
        { player_name: "Sanju Samson" },
        { player_name: "Noor Ahmad" },
        { player_name: "Dewald Brevis" },
        { player_name: "Mukesh Choudhury" },
        { player_name: "Matt Short" },
        { player_name: "Spencer Johnson" },
        { player_name: "Karthik Sharma" },
        { player_name: "Matt Henry" },
        { player_name: "MS Dhoni" },
        { player_name: "Shreyas Gopal" },
        { player_name: "Aman Khan" },
      ],
    },
    {
      team_name: "D-A",
      owner_name: "D-A",
      players: [
        { player_name: "Shivam Dube" },
        { player_name: "Anshul Kamboj" },
        { player_name: "Urvil Patel" },
      ],
    },
    {
      team_name: "PI",
      owner_name: "PI",
      players: [{ player_name: "Ayush Mhatre" }, { player_name: "Akeal Hosein" }],
    },
    {
      team_name: "R-A",
      owner_name: "R-A",
      players: [
        { player_name: "Sarfaraz Khan" },
        { player_name: "Rahul Chahar" },
        { player_name: "Zak Foulkes" },
        { player_name: "Gurjapneet Singh" },
        { player_name: "Jamie Overton" },
      ],
    },
    {
      team_name: "A-I",
      owner_name: "A-I",
      players: [
        { player_name: "Ruturaj Gaikwad" },
        { player_name: "Khaleel Ahmed" },
        { player_name: "Prashant Veer" },
        { player_name: "Ramakrishna Ghosh" },
      ],
    },
  ],
  DC: [
    {
      team_name: "Ainesh",
      owner_name: "Ainesh",
      players: [
        { player_name: "Mitchell Starc" },
        { player_name: "Ashutosh Sharma" },
        { player_name: "Dushmantha Chameera" },
        { player_name: "Karun Nair" },
        { player_name: "David Miller" },
      ],
    },
    {
      team_name: "D-A",
      owner_name: "D-A",
      players: [
        { player_name: "KL Rahul (C)" },
        { player_name: "Kuldeep Yadav" },
        { player_name: "Aaqib Nabi" },
      ],
    },
    {
      team_name: "PI",
      owner_name: "PI",
      players: [
        { player_name: "Axar Patel" },
        { player_name: "Madhav Tiwari" },
        { player_name: "Pathum Nissanka" },
        { player_name: "T Natarajan" },
        { player_name: "Vipraj Nigam" },
        { player_name: "Tripurana Vijay" },
      ],
    },
    {
      team_name: "R-A",
      owner_name: "R-A",
      players: [
        { player_name: "Tristan Stubbs" },
        { player_name: "Nitish Rana" },
        { player_name: "Lungi Ngidi" },
        { player_name: "Prithvi Shaw" },
        { player_name: "Sameer Rizvi" },
        { player_name: "Kyle Jamieson" },
        { player_name: "Abhishek Porel" },
      ],
    },
    {
      team_name: "A-I",
      owner_name: "A-I",
      players: [
        { player_name: "Mukesh Kumar" },
        { player_name: "Ben Duckett" },
        { player_name: "Ajay Mandal" },
        { player_name: "Sahil Parakh" },
      ],
    },
  ],
  GT: [
    {
      team_name: "Ainesh",
      owner_name: "Ainesh",
      players: [
        { player_name: "Jos Buttler (RTM)" },
        { player_name: "Prasidh Krishna" },
        { player_name: "Glenn Phillips" },
        { player_name: "Jayant Yadav" },
        { player_name: "Washington Sundar" },
      ],
    },
    {
      team_name: "D-A",
      owner_name: "D-A",
      players: [
        { player_name: "Rashid Khan" },
        { player_name: "Manav Suthar" },
        { player_name: "R Sai Kishore" },
      ],
    },
    {
      team_name: "PI",
      owner_name: "PI",
      players: [
        { player_name: "Kagiso Rabada" },
        { player_name: "Shah Rukh Khan" },
        { player_name: "Kulwant Khejroliya" },
        { player_name: "Mohammad Siraj" },
        { player_name: "Arshad Khan" },
      ],
    },
    {
      team_name: "R-A",
      owner_name: "R-A",
      players: [
        { player_name: "Sai Sudharshan (C)" },
        { player_name: "Ishant Sharma" },
        { player_name: "Rahul Tewatia" },
        { player_name: "Anuj Rawaj" },
        { player_name: "Nishant Sindhu" },
        { player_name: "Tom Banton" },
        { player_name: "Luke Wood" },
        { player_name: "Jason Holder" },
        { player_name: "Gurnoor Brar" },
      ],
    },
    {
      team_name: "A-I",
      owner_name: "A-I",
      players: [
        { player_name: "Shubman Gill (C)" },
        { player_name: "Ashok Sharma" },
        { player_name: "Kumar Kushagra" },
      ],
    },
  ],
  KKR: [
    {
      team_name: "Ainesh",
      owner_name: "Ainesh",
      players: [
        { player_name: "Rovman Powell" },
        { player_name: "Umran Malik" },
        { player_name: "Saurabh Dubey" },
        { player_name: "Rahul Tripathi" },
        { player_name: "Karthik Tyagi" },
        { player_name: "Sarthak Ranjan" },
      ],
    },
    {
      team_name: "D-A",
      owner_name: "D-A",
      players: [
        { player_name: "Varun Chakravarthy" },
        { player_name: "Navdeep Saini" },
        { player_name: "Manish Pandey" },
        { player_name: "Rachin Ravindra" },
      ],
    },
    {
      team_name: "PI",
      owner_name: "PI",
      players: [
        { player_name: "Sunil Narine" },
        { player_name: "Matheesha Pathirana" },
        { player_name: "Finn Allen" },
        { player_name: "Vaibhav Arora" },
        { player_name: "Rinku Singh" },
        { player_name: "Blessing Muzarabani" },
        { player_name: "Ramandeep Singh" },
        { player_name: "Angkrish Raghuvanshi" },
        { player_name: "Prashant Solanki" },
        { player_name: "Daksh Kamra" },
      ],
    },
    {
      team_name: "R-A",
      owner_name: "R-A",
      players: [{ player_name: "Cameron Green (VC)" }, { player_name: "Anukul Roy" }],
    },
    {
      team_name: "A-I",
      owner_name: "A-I",
      players: [
        { player_name: "Ajinkya Rahane" },
        { player_name: "Tejasvi Dahiya" },
        { player_name: "Tim Seifert" },
      ],
    },
  ],
  LSG: [
    {
      team_name: "Ainesh",
      owner_name: "Ainesh",
      players: [{ player_name: "Abdul Samad" }, { player_name: "Matthew Breetzke" }],
    },
    {
      team_name: "D-A",
      owner_name: "D-A",
      players: [
        { player_name: "Nicholas Pooran" },
        { player_name: "Mohammad Shami" },
        { player_name: "Wanindu Hasaranga" },
      ],
    },
    {
      team_name: "PI",
      owner_name: "PI",
      players: [
        { player_name: "Aiden Markram (C)" },
        { player_name: "Himmat Singh" },
        { player_name: "Josh Inglis" },
        { player_name: "Mayank Yadav" },
        { player_name: "Avesh Khan" },
        { player_name: "M Siddharth" },
        { player_name: "Mohsin Khan" },
        { player_name: "Anrich Nortje" },
        { player_name: "Akshat Raghuwanshi" },
      ],
    },
    {
      team_name: "R-A",
      owner_name: "R-A",
      players: [
        { player_name: "Rishabh Pant" },
        { player_name: "Ayush Badoni" },
        { player_name: "Shahbaz Ahmed" },
        { player_name: "Arshin Kulkarni" },
        { player_name: "Digvesh Rathi" },
        { player_name: "Arjun Tendulkar" },
        { player_name: "Akash Singh" },
      ],
    },
    {
      team_name: "A-I",
      owner_name: "A-I",
      players: [
        { player_name: "Mitchell Marsh" },
        { player_name: "Mukul Choudhary" },
        { player_name: "Prince Yadav" },
        { player_name: "Naman Tiwari" },
      ],
    },
  ],
  MI: [
    {
      team_name: "Ainesh",
      owner_name: "Ainesh",
      players: [
        { player_name: "Will Jacks" },
        { player_name: "Mayank Markhande" },
        { player_name: "Ryan Rickelton" },
        { player_name: "Robin Minz" },
        { player_name: "Raj Angad Bawa" },
      ],
    },
    {
      team_name: "D-A",
      owner_name: "D-A",
      players: [
        { player_name: "Jasprit Bumrah (VC)" },
        { player_name: "Shardul Thakur" },
        { player_name: "Ashwani Kumar" },
        { player_name: "Sherfane Rutherford" },
      ],
    },
    {
      team_name: "PI",
      owner_name: "PI",
      players: [
        { player_name: "Suryakumar Yadav" },
        { player_name: "Rohit Sharma" },
        { player_name: "Deepak Chahar" },
        { player_name: "Danish Malewar" },
      ],
    },
    {
      team_name: "R-A",
      owner_name: "R-A",
      players: [
        { player_name: "Hardik Pandya" },
        { player_name: "Trent Boult" },
        { player_name: "Tilak Verma (RTM)" },
        { player_name: "Raghu Sharma" },
        { player_name: "Quinton de Kock" },
        { player_name: "Naman Dhir" },
        { player_name: "Mitchell Santner" },
        { player_name: "Mohammad Izhar" },
      ],
    },
    {
      team_name: "A-I",
      owner_name: "A-I",
      players: [
        { player_name: "Corbin Bosch" },
        { player_name: "Allah Ghazanfar" },
        { player_name: "Atharva Ankolekar" },
        { player_name: "Mayank Rawat" },
      ],
    },
  ],
  PBKS: [
    {
      team_name: "Ainesh",
      owner_name: "Ainesh",
      players: [{ player_name: "Marcus Stoinis" }, { player_name: "Harpreet Brar" }],
    },
    {
      team_name: "D-A",
      owner_name: "D-A",
      players: [
        { player_name: "Arshdeep Singh (RTM)" },
        { player_name: "Cooper Connolly" },
        { player_name: "Priyansh Arya" },
        { player_name: "Shashank Singh" },
      ],
    },
    {
      team_name: "PI",
      owner_name: "PI",
      players: [
        { player_name: "Nehal Wadhera" },
        { player_name: "Azmatullah Omarzai" },
        { player_name: "Lockie Ferguson" },
        { player_name: "Musheer Khan" },
        { player_name: "Mitch Owen" },
        { player_name: "Vyshak Vijaykumar" },
        { player_name: "Pyla Avinash" },
      ],
    },
    {
      team_name: "R-A",
      owner_name: "R-A",
      players: [
        { player_name: "Marco Jansen" },
        { player_name: "Suryansh Shedge" },
        { player_name: "Ben Dwarshuis" },
        { player_name: "Yash Thakur" },
        { player_name: "Pravin Dubey" },
        { player_name: "Vishnu Vinod" },
        { player_name: "Vishal Nishad" },
        { player_name: "Xavier Bartlett" },
      ],
    },
    {
      team_name: "A-I",
      owner_name: "A-I",
      players: [
        { player_name: "Shreyas Iyer (RTM)" },
        { player_name: "Prabhsimran Singh" },
        { player_name: "Yuzvendra Chahal" },
        { player_name: "Harnoor Pannu" },
      ],
    },
  ],
  RR: [
    {
      team_name: "Ainesh",
      owner_name: "Ainesh",
      players: [
        { player_name: "Dhruv Jurel" },
        { player_name: "Kuldeep Sen" },
        { player_name: "Shimron Hetmyer" },
      ],
    },
    {
      team_name: "D-A",
      owner_name: "D-A",
      players: [{ player_name: "Ravindra Jadeja" }, { player_name: "Vaibhav Suryavanshi" }],
    },
    {
      team_name: "PI",
      owner_name: "PI",
      players: [
        { player_name: "Riyan Parag (RTM)" },
        { player_name: "Ravi Bishnoi" },
        { player_name: "Tushar Deshpande" },
        { player_name: "Nandre Burger" },
        { player_name: "Kwena Maphaka" },
        { player_name: "Yudhvir Singh" },
        { player_name: "Lhuan-Dre Pretorious" },
      ],
    },
    {
      team_name: "R-A",
      owner_name: "R-A",
      players: [
        { player_name: "Jofra Archer" },
        { player_name: "Donovan Ferreira" },
        { player_name: "Adam Milne" },
        { player_name: "Shubham Dubey" },
        { player_name: "Dasun Shanaka" },
        { player_name: "Ravi Singh" },
        { player_name: "Vignesh Puthur" },
        { player_name: "Sushant Mishra" },
      ],
    },
    {
      team_name: "A-I",
      owner_name: "A-I",
      players: [
        { player_name: "Yashasvi Jaiswal (VC)" },
        { player_name: "Aman Rao" },
        { player_name: "Sandeep Sharma" },
        { player_name: "Yash Raj Punja" },
      ],
    },
  ],
  RCB: [
    {
      team_name: "Ainesh",
      owner_name: "Ainesh",
      players: [
        { player_name: "Virat Kohli (C)" },
        { player_name: "Swapnil Singh" },
        { player_name: "Nuwan Thushara" },
        { player_name: "Venkatesh Iyer" },
        { player_name: "Tim David" },
      ],
    },
    {
      team_name: "D-A",
      owner_name: "D-A",
      players: [
        { player_name: "Bhuvneshwar Kumar" },
        { player_name: "Suyash Sharma" },
        { player_name: "Kanishk Chohan" },
        { player_name: "Jitesh Sharma" },
        { player_name: "Vihaan Malhotra" },
        { player_name: "Jacob Duffy" },
      ],
    },
    {
      team_name: "PI",
      owner_name: "PI",
      players: [
        { player_name: "Rajat Patidar" },
        { player_name: "Devdutt Padikkal" },
        { player_name: "Rasikh Dar" },
      ],
    },
    {
      team_name: "R-A",
      owner_name: "R-A",
      players: [
        { player_name: "Josh Hazlewood" },
        { player_name: "Krunal Pandya" },
        { player_name: "Satwik Deswal" },
        { player_name: "Jordan Cox" },
        { player_name: "Jacob Bethell" },
        { player_name: "Yash Dayal" },
        { player_name: "Abhinandan Singh" },
      ],
    },
    {
      team_name: "A-I",
      owner_name: "A-I",
      players: [
        { player_name: "Phil Salt" },
        { player_name: "Vicky Ostwal" },
        { player_name: "Mangesh Yadav" },
        { player_name: "Romario Shepherd" },
      ],
    },
  ],
  SRH: [
    {
      team_name: "Ainesh",
      owner_name: "Ainesh",
      players: [{ player_name: "Abhishek Sharma (VC)" }, { player_name: "Liam Livingstone" }],
    },
    {
      team_name: "D-A",
      owner_name: "D-A",
      players: [
        { player_name: "Heinrich Klaasen" },
        { player_name: "Shivam Mavi" },
        { player_name: "Nitish Kumar Reddy" },
      ],
    },
    {
      team_name: "PI",
      owner_name: "PI",
      players: [
        { player_name: "Travis Head (VC)" },
        { player_name: "Harshal Patel" },
        { player_name: "Harsh Dubey" },
        { player_name: "Kamindu Mendis" },
        { player_name: "Eshan Malinga" },
        { player_name: "Brydon Carse" },
      ],
    },
    {
      team_name: "R-A",
      owner_name: "R-A",
      players: [
        { player_name: "Pat Cummins" },
        { player_name: "Onkar Tukaram" },
        { player_name: "Amit Kumar" },
        { player_name: "Sakib Hussain" },
        { player_name: "Jaydev Unadkat" },
        { player_name: "Shivang Kumar" },
      ],
    },
    {
      team_name: "A-I",
      owner_name: "A-I",
      players: [
        { player_name: "Ishan Kishan" },
        { player_name: "Salil Arora" },
        { player_name: "Zeeshan Ansari" },
        { player_name: "Aniket Verma" },
        { player_name: "Krains Fuletra" },
        { player_name: "David Payne" },
        { player_name: "R Smaran" },
        { player_name: "Praful Hinge" },
      ],
    },
  ],
};

const mergedTeams = new Map<string, AuctionTeam>();

for (const [iplCode, teams] of Object.entries(rawTeamsByIpl)) {
  const iplTeam = IPL_TEAM_BY_CODE.get(iplCode) ?? null;
  for (const team of teams) {
    const existing =
      mergedTeams.get(team.team_name) ??
      ({
        id: `auction-${team.team_name}`.toLowerCase(),
        team_name: team.team_name,
        owner_name: team.owner_name,
        players: [],
      } as AuctionTeam);

    existing.players.push(
      ...team.players.map((player) => ({
        id: `${iplCode}-${team.team_name}-${player.player_name}`
          .toLowerCase()
          .replace(/\s+/g, "-"),
        player_name: player.player_name,
        player_role: player.player_role ?? "TBD",
        ipl_team: iplTeam,
      })),
    );

    mergedTeams.set(team.team_name, existing);
  }
}

export const FALLBACK_TEAMS: AuctionTeam[] = [...mergedTeams.values()]
  .map((team) => ({
    ...team,
    players: [...team.players].sort((a, b) => a.player_name.localeCompare(b.player_name)),
  }))
  .sort((a, b) => a.team_name.localeCompare(b.team_name));
