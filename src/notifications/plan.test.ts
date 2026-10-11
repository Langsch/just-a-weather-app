import { describe, expect, it } from 'vitest'
import { parseMetno } from '../api/metno'
import { parseOpenMeteo } from '../api/openMeteo'
import { buildConsensus } from '../consensus/consensus'
import { MESSAGES } from '../i18n'
import { FIXTURE_NOW, RIO, metnoFixture, openMeteoFixture } from '../test/fixtures'
import { NOTIFICATION_BASE_ID, nextOccurrences, planDailyNotifications } from './plan'

// As ocorrências seguem o fuso do aparelho; o vite.config.ts fixa TZ=America/Sao_Paulo nos testes.

const forecast = buildConsensus(
  RIO,
  [...parseOpenMeteo(openMeteoFixture, ['ecmwf', 'gfs', 'icon', 'meteofrance'], ''), parseMetno(metnoFixture, RIO.timezone, '')],
  FIXTURE_NOW,
)

describe('nextOccurrences', () => {
  it('pula o horário de hoje se já passou', () => {
    const [first, second] = nextOccurrences('07:00', FIXTURE_NOW, 2) // agora: 19:30 de 10/10
    expect(first.toISOString()).toBe('2026-10-11T10:00:00.000Z') // 07:00 em São Paulo
    expect(second.toISOString()).toBe('2026-10-12T10:00:00.000Z')
  })

  it('inclui hoje se o horário ainda não chegou', () => {
    const [first] = nextOccurrences('21:00', FIXTURE_NOW, 1)
    expect(first.toISOString()).toBe('2026-10-11T00:00:00.000Z') // 21:00 de 10/10
  })
})

describe('planDailyNotifications', () => {
  const planned = planDailyNotifications(forecast, '07:00', 'c', MESSAGES.pt, FIXTURE_NOW)

  it('agenda um por dia enquanto houver previsão', () => {
    // Previsão vai até 16/10; a partir de 11/10 às 07:00 → 6 dias.
    expect(planned).toHaveLength(6)
    expect(planned.map((p) => p.id)).toEqual([0, 1, 2, 3, 4, 5].map((i) => NOTIFICATION_BASE_ID + i))
  })

  it('usa a temperatura da hora quando está nas próximas 48 h', () => {
    expect(planned[0].title).toMatch(/^Rio de Janeiro • -?\d+° agora$/)
    expect(planned[0].body).toMatch(/^máx \d+° \/ mín \d+° • [a-zà-ú]/)
    expect(planned[0].body).not.toMatch(/\.$/)
  })

  it('usa o dia da semana quando só há resumo diário', () => {
    expect(planned[3].title).toBe('Rio de Janeiro • QUA 14 out')
  })

  it('respeita a unidade', () => {
    const [f] = planDailyNotifications(forecast, '07:00', 'f', MESSAGES.pt, FIXTURE_NOW)
    const max = Number(f.body.match(/máx (\d+)°/)![1])
    expect(max).toBeGreaterThan(60)
  })
})

describe('planDailyNotifications em inglês', () => {
  const planned = planDailyNotifications(forecast, '07:00', 'c', MESSAGES.en, FIXTURE_NOW)

  it('traduz título e corpo', () => {
    expect(planned[0].title).toMatch(/^Rio de Janeiro • -?\d+° now$/)
    expect(planned[0].body).toMatch(/^high \d+° \/ low \d+° • [a-z]/)
    expect(planned[3].title).toBe('Rio de Janeiro • WED Oct 14')
  })

  it('usa o rótulo do idioma para a posição do GPS', () => {
    const gps = { ...forecast, location: { ...forecast.location, id: 'gps', name: '' } }
    const [first] = planDailyNotifications(gps, '07:00', 'c', MESSAGES.en, FIXTURE_NOW)
    expect(first.title.startsWith('My location • ')).toBe(true)
  })
})
