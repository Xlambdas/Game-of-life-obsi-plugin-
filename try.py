

def calcul_level(xp, lvlActuel):
  seuil = 100
  level = 0
  while xp >= seuil:
    level += 1
    if level == lvlActuel:
      print ("level actuel")
      return level, xp, seuil
    else:
      xp -= seuil
      seuil = int(seuil * 1.2)
      return level, xp, seuil

    print("all info : xp=", xp,"seuil=", seuil,"level=", level)
  return level, xp, seuil

def update(xp, amount):
	xp += amount
	print("You gain ----", amount, "---- xp=", xp)
	print("You are now level", calcul_level(xp, 1), "---- xp=", xp)

xp = 95
update(xp, 10)
