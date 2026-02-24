import json

arena_id = "08acfc87-6124-4be3-8b7b-63efed17617e"
user_id = "d38634ca-0403-4678-ac1d-beb3a5d5f0fb"

players = {
  "Peterson": {"id": "704c0c61-ea43-4749-b92b-4de34b24fb55", "name": "Peterson", "user_id": user_id, "arena_id": arena_id, "created_at": "2026-02-05T11:22:51.882537+00:00", "deleted_at": None},
  "Fernando": {"id": "eded6302-0e95-4abc-92f5-b25483fb82b2", "name": "Fernando", "user_id": user_id, "arena_id": arena_id, "created_at": "2026-02-05T11:22:56.897455+00:00", "deleted_at": None},
  "Pedrinho": {"id": "089c5655-7381-4664-84be-1010998b7bc9", "name": "Pedrinho", "user_id": user_id, "arena_id": arena_id, "created_at": "2026-02-05T11:23:01.735167+00:00", "deleted_at": None},
  "Italo": {"id": "ff5a5231-cabd-4d1f-8600-fa32695be7f9", "name": "Italo", "user_id": user_id, "arena_id": arena_id, "created_at": "2026-02-05T11:23:06.436896+00:00", "deleted_at": None},
  "Luiz": {"id": "a9ea67c2-5a5f-4275-b92d-be0e1ce30e98", "name": "Luiz", "user_id": user_id, "arena_id": arena_id, "created_at": "2026-02-05T11:23:09.783548+00:00", "deleted_at": None},
  "Lucas": {"id": "8ada090b-f0bb-46a4-a8f7-54f286ebf3a7", "name": "Lucas", "user_id": user_id, "arena_id": arena_id, "created_at": "2026-02-05T11:23:23.564502+00:00", "deleted_at": None},
  "Joao": {"id": "65c0d99d-4d88-435a-8da9-acb8124bd24c", "name": "João", "user_id": user_id, "arena_id": arena_id, "created_at": "2026-02-24T14:42:18.578839+00:00", "deleted_at": None},
  "Pedro": {"id": "a31b17e2-18fa-4229-adae-ff75bde11db4", "name": "Pedro", "user_id": user_id, "arena_id": arena_id, "created_at": "2026-02-24T15:01:48.541057+00:00", "deleted_at": None},
}

name_map = {
  "Peterson": "Peterson",
  "Italo": "Italo",
  "Fernando": "Fernando",
  "Joao": "Joao",
  "João": "Joao",
  "Luiz": "Luiz",
  "Lucas": "Lucas",
  "Pedrinho": "Pedrinho",
  "Pedro": "Pedro",
}

# Partida 2 a 17 (partida 1 ja foi inserida)
matches_raw = [
  ("Peterson / Italo", "Fernando / João", 2, 3),
  ("Luiz / Fernando", "Lucas / João", 8, 10),
  ("Lucas / Italo", "João / Peterson", 10, 6),
  ("Luiz / Lucas", "Fernando / Italo", 10, 5),
  ("Lucas / João", "Luiz / Peterson", 3, 10),
  ("Fernando / Peterson", "Luiz / Italo", 2, 3),
  ("Pedro / Italo", "Luiz / Lucas", 2, 3),
  ("Luiz / Peterson", "Lucas / Fernando", 0, 5),
  ("Italo / Fernando", "Lucas / João", 3, 0),
  ("Fernando / Pedro", "Luiz / Italo", 10, 7),
  ("Fernando / Peterson", "Pedro / João", 0, 3),
  ("Lucas / Pedrinho", "Italo / João", 7, 10),
  ("Italo / Peterson", "Luiz / João", 3, 10),
  ("João / Fernando", "Luiz / Lucas", 7, 10),
  ("João / Pedrinho", "Luiz / Italo", 2, 3),
  ("Pedro / Luiz", "Italo / Lucas", 10, 6),
]

def get_player(name_str):
    key = name_str.strip()
    # normalize João
    if key == "João":
        key = "Joao"
    return players[key]

# Segunda partida começa às 18:14 (18:07 foi a primeira, cada partida +7min)
base_minutes = 18 * 60 + 7 + 7  # 18:14

values = []
for i, (a_str, b_str, scoreA, scoreB) in enumerate(matches_raw):
    a_names = [n.strip() for n in a_str.split("/")]
    b_names = [n.strip() for n in b_str.split("/")]
    
    teamA_players = [get_player(n) for n in a_names]
    teamB_players = [get_player(n) for n in b_names]
    
    winner = "A" if scoreA > scoreB else "B"
    
    data_json = {
        "teamA": {"score": scoreA, "players": teamA_players},
        "teamB": {"score": scoreB, "players": teamB_players},
        "winner": winner,
        "duration": 7
    }
    
    t = base_minutes + i * 7
    h = t // 60
    m = t % 60
    time_str = f"2026-02-19 {h:02d}:{m:02d}:00-03"
    
    json_str = json.dumps(data_json, ensure_ascii=False).replace("'", "''")
    values.append(f"('{time_str}', '{arena_id}', '{user_id}', '{json_str}'::jsonb)")

with open("inserts_utf8.sql", "w", encoding="utf-8") as f:
    f.write("INSERT INTO matches (created_at, arena_id, user_id, data_json) VALUES\n")
    f.write(",\n".join(values) + ";\n")
