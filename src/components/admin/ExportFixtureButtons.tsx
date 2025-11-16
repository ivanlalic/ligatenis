'use client'

import { useState } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

interface Match {
  id: string
  player1_id: string
  player2_id: string
  winner_id: string | null
  is_walkover: boolean
  is_not_reported: boolean
  set1_player1_games: number | null
  set1_player2_games: number | null
  set2_player1_games: number | null
  set2_player2_games: number | null
  set3_player1_games: number | null
  set3_player2_games: number | null
  player1: {
    first_name: string
    last_name: string
  }
  player2: {
    first_name: string
    last_name: string
  }
}

interface Round {
  id: string
  round_number: number
  period_start: string
  period_end: string
  closed_by_admin_at: string | null
  matches: Match[]
}

interface ExportFixtureButtonsProps {
  categoryName: string
  seasonYear: number
  rounds: Round[]
  singleRound?: Round | null
}

export default function ExportFixtureButtons({
  categoryName,
  seasonYear,
  rounds,
  singleRound,
}: ExportFixtureButtonsProps) {
  const [isExporting, setIsExporting] = useState(false)

  const formatPlayerName = (player: { first_name: string; last_name: string }) => {
    return `${player.last_name}, ${player.first_name}`
  }

  const formatScore = (match: Match) => {
    if (match.is_walkover) {
      return 'WO'
    }
    if (match.is_not_reported) {
      return 'No reportado'
    }
    if (!match.winner_id) {
      return '-'
    }

    const set1 = `${match.set1_player1_games}-${match.set1_player2_games}`
    const set2 = `${match.set2_player1_games}-${match.set2_player2_games}`
    const set3 =
      match.set3_player1_games !== null
        ? ` ${match.set3_player1_games}-${match.set3_player2_games}`
        : ''
    return `${set1} ${set2}${set3}`
  }

  const getWinner = (match: Match) => {
    if (!match.winner_id) return ''
    return match.winner_id === match.player1_id
      ? formatPlayerName(match.player1)
      : formatPlayerName(match.player2)
  }

  const exportToPDF = () => {
    setIsExporting(true)
    try {
      const doc = new jsPDF()
      const dataToExport = singleRound ? [singleRound] : rounds

      // Título
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text('🎾 Plaza Jewell', 14, 20)

      doc.setFontSize(14)
      doc.text(`${categoryName} - Temporada ${seasonYear}`, 14, 28)

      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      if (singleRound) {
        doc.text(`Fecha ${singleRound.round_number}`, 14, 36)
      } else {
        doc.text('Fixture Completo', 14, 36)
      }

      let yPosition = 45

      dataToExport.forEach((round, index) => {
        // Nueva página si no es la primera fecha y no hay espacio
        if (index > 0 && yPosition > 250) {
          doc.addPage()
          yPosition = 20
        }

        // Header de la fecha
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.text(`Fecha ${round.round_number}`, 14, yPosition)

        const startDate = new Date(round.period_start + 'T00:00:00').toLocaleDateString('es-AR')
        const endDate = new Date(round.period_end + 'T00:00:00').toLocaleDateString('es-AR')
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.text(`Del ${startDate} al ${endDate}`, 14, yPosition + 5)

        if (round.closed_by_admin_at) {
          doc.setTextColor(0, 128, 0)
          doc.text('✓ Cerrada', 14, yPosition + 10)
          doc.setTextColor(0, 0, 0)
        }

        yPosition += 15

        // Tabla de partidos
        const tableData = round.matches.map((match) => {
          const p1 = formatPlayerName(match.player1)
          const p2 = formatPlayerName(match.player2)
          const score = formatScore(match)
          const winner = getWinner(match)

          return [p1, 'vs', p2, score, winner]
        })

        autoTable(doc, {
          startY: yPosition,
          head: [['Jugador 1', '', 'Jugador 2', 'Resultado', 'Ganador']],
          body: tableData,
          theme: 'grid',
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [122, 31, 61], textColor: 255 }, // Granate
          columnStyles: {
            1: { halign: 'center', fontStyle: 'bold' },
            3: { halign: 'center', fontStyle: 'bold' },
            4: { fontStyle: 'bold' },
          },
          margin: { left: 14, right: 14 },
        })

        yPosition = (doc as any).lastAutoTable.finalY + 10
      })

      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(128)
        doc.text(
          `Página ${i} de ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        )
      }

      // Descargar
      const fileName = singleRound
        ? `fixture-${categoryName}-fecha${singleRound.round_number}.pdf`
        : `fixture-${categoryName}-completo.pdf`

      doc.save(fileName)
    } catch (error) {
      console.error('Error al exportar PDF:', error)
      alert('Error al exportar a PDF')
    } finally {
      setIsExporting(false)
    }
  }

  const exportToExcel = () => {
    setIsExporting(true)
    try {
      const dataToExport = singleRound ? [singleRound] : rounds
      const workbook = XLSX.utils.book_new()

      dataToExport.forEach((round) => {
        const data = [
          [`Fecha ${round.round_number}`],
          [
            `Del ${new Date(round.period_start + 'T00:00:00').toLocaleDateString('es-AR')} al ${new Date(round.period_end + 'T00:00:00').toLocaleDateString('es-AR')}`,
          ],
          [round.closed_by_admin_at ? 'Estado: Cerrada' : 'Estado: Abierta'],
          [],
          ['Jugador 1', '', 'Jugador 2', 'Resultado', 'Ganador'],
        ]

        round.matches.forEach((match) => {
          data.push([
            formatPlayerName(match.player1),
            'vs',
            formatPlayerName(match.player2),
            formatScore(match),
            getWinner(match),
          ])
        })

        const worksheet = XLSX.utils.aoa_to_sheet(data)

        // Ancho de columnas
        worksheet['!cols'] = [
          { wch: 25 }, // Jugador 1
          { wch: 3 }, // vs
          { wch: 25 }, // Jugador 2
          { wch: 15 }, // Resultado
          { wch: 25 }, // Ganador
        ]

        XLSX.utils.book_append_sheet(workbook, worksheet, `Fecha ${round.round_number}`)
      })

      // Descargar
      const fileName = singleRound
        ? `fixture-${categoryName}-fecha${singleRound.round_number}.xlsx`
        : `fixture-${categoryName}-completo.xlsx`

      XLSX.writeFile(workbook, fileName)
    } catch (error) {
      console.error('Error al exportar Excel:', error)
      alert('Error al exportar a Excel')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={exportToPDF}
        disabled={isExporting}
        className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
      >
        <span>📥</span>
        <span>{isExporting ? 'Exportando...' : 'PDF'}</span>
      </button>
      <button
        onClick={exportToExcel}
        disabled={isExporting}
        className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
      >
        <span>📊</span>
        <span>{isExporting ? 'Exportando...' : 'Excel'}</span>
      </button>
    </div>
  )
}
