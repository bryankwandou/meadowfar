// "Bintang yang Hilang dari Langit Meadowfar" / "The Lost Stars of Meadowfar"
// 12 chapters told by village elders, in both Indonesian and English.

export interface Chapter {
  bab: number;
  judul: string;
  teks: string;
  judulEn: string;
  teksEn: string;
  // What the elder asks you to do next — turns a read-only chapter into a deed.
  tugas: string;
  tugasEn: string;
}

// Each chapter points at the quest kind the elder wants next, so the story and
// the gameplay rotation actually agree with each other.
export const CHAPTER_TASK: Record<number, "collect" | "race" | "treasure" | "delivery" | "shard"> = {
  1: "collect", 2: "collect", 3: "race", 4: "treasure",
  5: "treasure", 6: "delivery", 7: "shard", 8: "collect",
  9: "race", 10: "delivery", 11: "shard", 12: "shard",
};

export const STORY: Chapter[] = [
  {
    bab: 1,
    judul: "Langit yang meredup",
    teks: "Dahulu, langit Meadowfar penuh bintang yang bernyanyi setiap malam. Namun suatu pagi, para tetua terbangun dan menghitung: dua belas bintang paling terang telah hilang. Sejak itu, kami menunggu seorang penjelajah kecil yang berani berjalan sampai ke tepi dunia.",
    judulEn: "The sky that dimmed",
    teksEn: "Long ago, the sky above Meadowfar was full of stars that sang every night. But one morning the elders woke and counted: the twelve brightest stars were gone. Ever since, we have waited for a small explorer brave enough to walk to the edge of the world.",
    tugas: "Mulailah dari yang sederhana: kumpulkan serpihan berkilau di padang ini.",
    tugasEn: "Start simple: gather the glittering pieces scattered across this meadow.",
  },
  {
    bab: 2,
    judul: "Jejak cahaya pertama",
    teks: "Bintang tidak jatuh begitu saja. Mereka pecah menjadi serpihan kecil — bintang emas, buah beri yang berpendar, kristal biru. Setiap kali kamu mengumpulkannya, satu serpihan kembali ke langit. Kamu sudah membantu lebih dari yang kamu tahu.",
    judulEn: "The first trail of light",
    teksEn: "Stars do not simply fall. They shatter into tiny pieces — golden stars, glowing berries, blue crystals. Every time you gather one, a piece returns to the sky. You have already helped more than you know.",
    tugas: "Kumpulkan satu genggam serpihan lagi — tiap satu membuat langit sedikit terang.",
    tugasEn: "Gather one more handful of pieces — each one brightens the sky a little.",
  },
  {
    bab: 3,
    judul: "Kelinci yang tahu jalan",
    teks: "Perhatikan kelinci-kelinci putih itu. Mereka dulu tidur di bawah cahaya bintang, dan kini mereka melompat-lompat gelisah mencarinya. Konon, mereka selalu berlari ke arah serpihan yang paling dekat. Ikuti mereka bila kamu tersesat.",
    judulEn: "The rabbits who know the way",
    teksEn: "Watch the white rabbits. They used to sleep beneath the starlight, and now they hop about restlessly searching for it. They say the rabbits always run toward the nearest star piece. Follow them if you ever feel lost.",
    tugas: "Berlarilah secepat kelinci: lewati semua gerbang cahaya sebelum waktu habis.",
    tugasEn: "Run as fast as a rabbit: pass every gate of light before the time runs out.",
  },
  {
    bab: 4,
    judul: "Angin dari gurun",
    teks: "Jauh di sana, rumput berubah menjadi pasir keemasan. Di gurun itu, satu bintang jatuh dan pasirnya masih hangat sampai sekarang. Bawalah air dan keberanian — gurun luas, tapi tidak pernah kejam pada anak yang baik hati.",
    judulEn: "Wind from the desert",
    teksEn: "Far away, the grass turns into golden sand. One star fell in that desert, and the sand is still warm to this day. Bring water and courage — the desert is vast, but it is never cruel to a kind-hearted child.",
    tugas: "Carilah peti bertanda X — di dalamnya tersimpan hangatnya bintang gurun.",
    tugasEn: "Look for the chest marked with an X — the desert star's warmth is kept inside.",
  },
  {
    bab: 5,
    judul: "Nyanyian salju",
    teks: "Ke arah yang lain, dunia menjadi putih dan sunyi. Di padang salju, suara paling kecil pun terdengar seperti lonceng. Para tetua percaya satu bintang bersembunyi di sana, membeku, menunggu seseorang yang cukup hangat hatinya untuk menemukannya.",
    judulEn: "The song of the snow",
    teksEn: "In the other direction, the world turns white and silent. On the snowfield, even the smallest sound rings like a bell. The elders believe one star hides there, frozen, waiting for someone warm-hearted enough to find it.",
    tugas: "Temukan peti yang terkubur — bintang beku itu butuh tangan yang hangat.",
    tugasEn: "Find the buried chest — that frozen star needs a warm pair of hands.",
  },
  {
    bab: 6,
    judul: "Setengah perjalanan",
    teks: "Enam bab sudah kamu dengar, dan langit mulai berubah. Lihatlah malam ini — ada kerlip kecil yang kemarin belum ada. Itu karena kamu. Istirahatlah di desa kami kapan pun kakimu lelah; pintu kami selalu terbuka.",
    judulEn: "Halfway there",
    teksEn: "You have heard six chapters now, and the sky is beginning to change. Look tonight — there is a small twinkle that was not there yesterday. That is because of you. Rest in our village whenever your feet grow tired; our doors are always open.",
    tugas: "Bantu kami sedikit: antarkan sebuah paket ke tempat bertanda hijau.",
    tugasEn: "Help us in return: carry a package to the spot marked in green.",
  },
  {
    bab: 7,
    judul: "Danau yang memantulkan langit",
    teks: "Danau-danau di lembah bukan air biasa. Saat malam tiba, permukaannya memantulkan langit seperti cermin, dan bintang yang hilang kadang terlihat di pantulan itu meski tidak ada di atas. Para tetua menyebutnya 'jendela langit'.",
    judulEn: "The lake that mirrors the sky",
    teksEn: "The lakes in the valleys are no ordinary water. When night falls, their surface mirrors the sky, and sometimes the lost stars appear in the reflection even when they are missing above. The elders call them 'windows to the sky'.",
    tugas: "Bawalah pecahan bintang ke altar batu, lalu letakkan pelan-pelan.",
    tugasEn: "Carry a star shard to the stone altar, and set it down gently.",
  },
  {
    bab: 8,
    judul: "Penjaga kecil bercahaya",
    teks: "Kunang-kunang adalah anak-anak bintang. Mereka keluar setiap malam untuk menghibur langit yang kesepian. Kalau kamu berjalan malam hari dengan lentera, mereka akan mengiringimu — mereka mengira lenteramu adalah saudara mereka.",
    judulEn: "The little glowing keepers",
    teksEn: "Fireflies are the children of the stars. They come out every night to comfort the lonely sky. If you walk at night carrying a lantern, they will travel beside you — they believe your lantern is their sibling.",
    tugas: "Kumpulkan serpihan saat malam, ditemani kunang-kunang dan lenteramu.",
    tugasEn: "Gather pieces after dark, with the fireflies and your lantern for company.",
  },
  {
    bab: 9,
    judul: "Kisah sang satria",
    teks: "Dahulu ada satria yang mencoba mengembalikan bintang dengan pedang dan perisai. Ia gagal. Bintang tidak bisa dipaksa pulang — mereka hanya kembali untuk tawa, langkah kecil, dan tangan yang mengumpulkan serpihan dengan sabar. Karena itulah kami menunggumu, bukan pasukan.",
    judulEn: "The tale of the knight",
    teksEn: "Once, a knight tried to bring the stars back with a sword and shield. He failed. Stars cannot be forced home — they only return for laughter, small footsteps, and hands that gather the pieces patiently. That is why we waited for you, not an army.",
    tugas: "Tunjukkan cara yang benar: menang balapan dengan kaki ringan, bukan pedang.",
    tugasEn: "Show the better way: win a race on light feet, not with a sword.",
  },
  {
    bab: 10,
    judul: "Peta yang tidak pernah selesai",
    teks: "Dunia ini tumbuh mengikuti langkahmu. Ke mana pun kamu berjalan, bukit baru bangun dari tidurnya dan pohon baru menegakkan punggungnya. Tidak ada tepi dunia — yang ada hanya bagian yang belum kamu sapa.",
    judulEn: "The map that is never finished",
    teksEn: "This world grows with your footsteps. Wherever you walk, new hills wake from their sleep and new trees straighten their backs. There is no edge of the world — only places you have not yet said hello to.",
    tugas: "Berjalanlah ke tempat yang belum kamu sapa, dan antarkan paket ke sana.",
    tugasEn: "Walk somewhere you have not greeted yet, and deliver a package there.",
  },
  {
    bab: 11,
    judul: "Malam paling terang",
    teks: "Sebelas bintang sudah pulang. Satu yang terakhir adalah bintang paling kecil dan paling pemalu. Ia tidak bersembunyi di gurun, salju, atau danau. Ia mengikutimu diam-diam sejak langkah pertamamu, menunggu kamu selesai mendengar semua kisah kami.",
    judulEn: "The brightest night",
    teksEn: "Eleven stars have come home. The last one is the smallest and shyest star of all. It is not hiding in the desert, the snow, or the lakes. It has been quietly following you since your very first step, waiting for you to finish hearing all our stories.",
    tugas: "Antarkan pecahan terakhir ke altar — bintang pemalu itu akan mengikutimu.",
    tugasEn: "Bring the last shard to the altar — the shy star will follow you there.",
  },
  {
    bab: 12,
    judul: "Penjaga bintang",
    teks: "Sekarang menoleh ke atas. Bintang kecil itu ada di langit lagi — pulang tepat saat kamu mendengar kata-kata ini. Langit Meadowfar utuh kembali, dan mulai malam ini semua bintang bersinar untukmu, sang Penjaga Bintang. Kisah selesai, tapi padang ini selamanya rumahmu.",
    judulEn: "Keeper of the stars",
    teksEn: "Now look up. The little star is back in the sky — it returned the very moment you heard these words. The sky of Meadowfar is whole again, and from tonight on, every star shines for you, Keeper of the Stars. The story is finished, but this meadow is your home forever.",
    tugas: "Tidak ada lagi tugas. Pulanglah ke rumah pohonmu dan hiasi sesukamu.",
    tugasEn: "No more tasks. Go home to your tree house and decorate it however you like.",
  },
];
