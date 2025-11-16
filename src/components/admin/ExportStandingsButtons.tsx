'use client'

import { useState } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

interface Standing {
  position: number
  player: {
    first_name: string
    last_name: string
  }
  matches_played: number
  matches_won: number
  matches_lost: number
  points: number
  sets_won: number
  sets_lost: number
  games_won: number
  games_lost: number
}

interface ExportStandingsButtonsProps {
  categoryName: string
  seasonYear: number
  standings: Standing[]
  lastClosedRound?: number | null
}

export default function ExportStandingsButtons({
  categoryName,
  seasonYear,
  standings,
  lastClosedRound,
}: ExportStandingsButtonsProps) {
  const [isExporting, setIsExporting] = useState(false)

  const exportToPDF = () => {
    setIsExporting(true)
    try {
      const doc = new jsPDF()

      // Título
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text('🎾 Plaza Jewell', 14, 20)

      doc.setFontSize(14)
      doc.text(`${categoryName} - Temporada ${seasonYear}`, 14, 28)

      doc.setFontSize(12)
      doc.text('Tabla de Posiciones', 14, 36)

      if (lastClosedRound) {
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(100)
        doc.text(`Actualizada a Fecha ${lastClosedRound}`, 14, 42)
        doc.setTextColor(0)
      }

      // Tabla
      const tableData = standings.map((s) => {
        const setsDiff = s.sets_won - s.sets_lost
        const gamesDiff = s.games_won - s.games_lost
        return [
          s.position.toString(),
          `${s.player.last_name}, ${s.player.first_name}`,
          s.matches_played.toString(),
          s.matches_won.toString(),
          s.matches_lost.toString(),
          s.points.toString(),
          setsDiff > 0 ? `+${setsDiff}` : setsDiff.toString(),
          gamesDiff > 0 ? `+${gamesDiff}` : gamesDiff.toString(),
        ]
      })

      autoTable(doc, {
        startY: lastClosedRound ? 48 : 42,
        head: [['Pos', 'Jugador', 'PJ', 'G', 'P', 'Pts', 'Dif.Sets', 'Dif.Games']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [122, 31, 61], textColor: 255 }, // Granate
        columnStyles: {
          0: { halign: 'center', fontStyle: 'bold' },
          2: { halign: 'center' },
          3: { halign: 'center' },
          4: { halign: 'center' },
          5: { halign: 'center', fontStyle: 'bold' },
          6: { halign: 'center' },
          7: { halign: 'center' },
        },
        margin: { left: 14, right: 14 },
      })

      // Footer
      doc.setFontSize(8)
      doc.setTextColor(128)
      doc.text(
        `Generado el ${new Date().toLocaleDateString('es-AR')}`,
        14,
        doc.internal.pageSize.height - 10
      )

      // Descargar
      doc.save(`tabla-posiciones-${categoryName}.pdf`)
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
      const data = [
        ['Tabla de Posiciones'],
        [`${categoryName} - Temporada ${seasonYear}`],
        lastClosedRound ? [`Actualizada a Fecha ${lastClosedRound}`] : [],
        [],
        ['Pos', 'Jugador', 'PJ', 'G', 'P', 'Pts', 'Dif.Sets', 'Dif.Games'],
      ]

      standings.forEach((s) => {
        const setsDiff = s.sets_won - s.sets_lost
        const gamesDiff = s.games_won - s.games_lost
        data.push([
          s.position.toString(),
          `${s.player.last_name}, ${s.player.first_name}`,
          s.matches_played.toString(),
          s.matches_won.toString(),
          s.matches_lost.toString(),
          s.points.toString(),
          setsDiff > 0 ? `+${setsDiff}` : setsDiff.toString(),
          gamesDiff > 0 ? `+${gamesDiff}` : gamesDiff.toString(),
        ])
      })

      const worksheet = XLSX.utils.aoa_to_sheet(data)

      // Ancho de columnas
      worksheet['!cols'] = [
        { wch: 5 }, // Pos
        { wch: 25 }, // Jugador
        { wch: 5 }, // PJ
        { wch: 5 }, // G
        { wch: 5 }, // P
        { wch: 6 }, // Pts
        { wch: 10 }, // Dif.Sets
        { wch: 12 }, // Dif.Games
      ]

      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Tabla de Posiciones')

      // Descargar
      XLSX.writeFile(workbook, `tabla-posiciones-${categoryName}.xlsx`)
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
