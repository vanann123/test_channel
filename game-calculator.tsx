"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Dữ liệu từ bảng shop
const shopData = [
  { money: 20000, itemNum: 3500000 },
  { money: 50000, itemNum: 9000000 },
  { money: 70000, itemNum: 12600000 },
  { money: 100000, itemNum: 19000000 },
  { money: 150000, itemNum: 39000000 },
  { money: 200000, itemNum: 42000000 },
  { money: 500000, itemNum: 120000000 },
  { money: 1000000, itemNum: 270000000 }
]

// Dữ liệu từ bảng channel - thêm cột lossRate
const initialChannelData = [
  { channelId: 0, minGold: 10000, maxGold: 100000, bets: 1000, lossRate: 15, maxLossMoney: 15000 },
  { channelId: 1, minGold: 50000, maxGold: 300000, bets: 5000, lossRate: 15, maxLossMoney: 75000 },
  { channelId: 2, minGold: 100000, maxGold: 500000, bets: 10000, lossRate: 15, maxLossMoney: 150000 },
  { channelId: 3, minGold: 300000, maxGold: 2000000, bets: 15000, lossRate: 15, maxLossMoney: 225000 },
  { channelId: 4, minGold: 300000, maxGold: 2000000, bets: 20000, lossRate: 15, maxLossMoney: 300000 },
  { channelId: 5, minGold: 300000, maxGold: 5000000, bets: 50000, lossRate: 15, maxLossMoney: 750000 },
  { channelId: 6, minGold: 2000000, maxGold: 60000000, bets: 100000, lossRate: 15, maxLossMoney: 1500000 },
  { channelId: 7, minGold: 5000000, maxGold: 100000000, bets: 200000, lossRate: 15, maxLossMoney: 3000000 },
  { channelId: 8, minGold: 9000000, maxGold: 160000000, bets: 300000, lossRate: 15, maxLossMoney: 4500000 },
  { channelId: 9, minGold: 10000000, maxGold: 300000000, bets: 500000, lossRate: 15, maxLossMoney: 7500000 },
  { channelId: 10, minGold: 25000000, maxGold: -1, bets: 1000000, lossRate: 15, maxLossMoney: 15000000 },
  { channelId: 11, minGold: 50000000, maxGold: -1, bets: 2000000, lossRate: 15, maxLossMoney: 30000000 },
  { channelId: 12, minGold: 150000000, maxGold: -1, bets: 5000000, lossRate: 15, maxLossMoney: 75000000 },
  { channelId: 13, minGold: 200000000, maxGold: -1, bets: 10000000, lossRate: 15, maxLossMoney: 150000000 },
  { channelId: 14, minGold: 500000000, maxGold: -1, bets: 20000000, lossRate: 15, maxLossMoney: 300000000 },
  { channelId: 15, minGold: 1500000000, maxGold: -1, bets: 50000000, lossRate: 15, maxLossMoney: 750000000 },
  { channelId: 16, minGold: 1500000000, maxGold: -1, bets: 100000000, lossRate: 15, maxLossMoney: 1500000000 },
  { channelId: 17, minGold: 1500000000, maxGold: -1, bets: 200000000, lossRate: 15, maxLossMoney: 3000000000 }
]

export default function GameCalculator() {
  const [customMoney, setCustomMoney] = useState("")
  const [customGold, setCustomGold] = useState("")
  const [channelData, setChannelData] = useState(initialChannelData)
  const [results, setResults] = useState<string[]>([])
  const [showDetails, setShowDetails] = useState(false)
  const [detailSteps, setDetailSteps] = useState<string[]>([])

  // Tính toán số vàng từ số tiền
  const getGoldFromMoney = (money: number): number => {
    const exactMatch = shopData.find(item => item.money === money)
    if (exactMatch) return exactMatch.itemNum

    // Nếu không có match chính xác, tính theo tỷ lệ
    const sortedShop = [...shopData].sort((a, b) => a.money - b.money)
    
    if (money < sortedShop[0].money) {
      const ratio = sortedShop[0].itemNum / sortedShop[0].money
      return Math.floor(money * ratio)
    }
    
    if (money > sortedShop[sortedShop.length - 1].money) {
      const ratio = sortedShop[sortedShop.length - 1].itemNum / sortedShop[sortedShop.length - 1].money
      return Math.floor(money * ratio)
    }

    // Interpolation
    for (let i = 0; i < sortedShop.length - 1; i++) {
      if (money >= sortedShop[i].money && money <= sortedShop[i + 1].money) {
        const ratio = (money - sortedShop[i].money) / (sortedShop[i + 1].money - sortedShop[i].money)
        return Math.floor(sortedShop[i].itemNum + ratio * (sortedShop[i + 1].itemNum - sortedShop[i].itemNum))
      }
    }
    
    return 0
  }

  // Tìm kênh thấp nhất có thể chơi
  const findLowestPlayableChannel = (gold: number) => {
    const sortedChannels = [...channelData].sort((a, b) => a.channelId - b.channelId)
    return sortedChannels.find(channel => 
      gold >= channel.minGold && (channel.maxGold === -1 || gold <= channel.maxGold)
    )
  }

  // Tính số ván chơi được - cập nhật sau mỗi ván
const calculateGames = (initialGold: number) => {
  let currentGold = initialGold
  const gameResults: { channelId: number; games: number }[] = []
  let totalGames = 0
  
  while (currentGold > 0 && totalGames < 10000) { // Giới hạn để tránh vòng lặp vô tận
    const channel = findLowestPlayableChannel(currentGold)
    if (!channel) break
    
    // Kiểm tra xem có đủ vàng để chơi 1 ván không
    if (currentGold < channel.maxLossMoney) break
    
    // Chơi 1 ván và trừ vàng
    currentGold -= channel.maxLossMoney
    totalGames++
    
    // Cập nhật kết quả
    const existingResult = gameResults.find(r => r.channelId === channel.channelId)
    if (existingResult) {
      existingResult.games++
    } else {
      gameResults.push({ channelId: channel.channelId, games: 1 })
    }
  }
  
  return gameResults
}

// Tính toán chi tiết từng bước
const calculateDetailedGames = (initialGold: number) => {
  let currentGold = initialGold
  const steps: string[] = []
  const gameResults: { channelId: number; games: number }[] = []
  let totalGames = 0
  
  steps.push(`Bắt đầu với ${currentGold.toLocaleString()} vàng`)
  
  while (currentGold > 0 && totalGames < 10000) {
    const channel = findLowestPlayableChannel(currentGold)
    if (!channel) {
      steps.push(`Không còn kênh nào có thể chơi với ${currentGold.toLocaleString()} vàng`)
      break
    }
    
    if (currentGold < channel.maxLossMoney) {
      steps.push(`Không đủ vàng để chơi kênh ${channel.channelId} (cần ${channel.maxLossMoney.toLocaleString()}, có ${currentGold.toLocaleString()})`)
      break
    }
    
    // Chơi 1 ván
    currentGold -= channel.maxLossMoney
    totalGames++
    
    steps.push(`Ván ${totalGames}: Chơi kênh ${channel.channelId}, thua ${channel.maxLossMoney.toLocaleString()} vàng, còn lại ${currentGold.toLocaleString()} vàng`)
    
    // Cập nhật kết quả
    const existingResult = gameResults.find(r => r.channelId === channel.channelId)
    if (existingResult) {
      existingResult.games++
    } else {
      gameResults.push({ channelId: channel.channelId, games: 1 })
    }
  }
  
  return { gameResults, steps }
}

  // Tính toán kết quả cho tất cả mốc tiền trong shop
  const calculateAllResults = () => {
    const newResults: string[] = []
    
    shopData.forEach(item => {
      const games = calculateGames(item.itemNum)
      const gameText = games.map(g => `${g.games} ván kênh ${g.channelId}`).join(', ')
      newResults.push(`${item.money.toLocaleString()} money ==> ${item.itemNum.toLocaleString()} gold: ${gameText || 'không chơi được ván nào'}`)
    })
    
    setResults(newResults)
  }

  // Tính toán cho số tiền/vàng tùy chỉnh
  const calculateCustom = () => {
  let gold = 0
  if (customMoney) {
    gold = getGoldFromMoney(parseInt(customMoney))
  } else if (customGold) {
    gold = parseInt(customGold)
  }
  
  if (gold > 0) {
    const { gameResults, steps } = calculateDetailedGames(gold)
    const gameText = gameResults.map(g => `${g.games} ván kênh ${g.channelId}`).join(', ')
    const result = `${gold.toLocaleString()} gold: ${gameText || 'không chơi được ván nào'}`
    setResults([result])
    setDetailSteps(steps)
  }
}

// Cập nhật dữ liệu kênh
const updateChannelData = (index: number, field: string, value: string) => {
  const newData = [...channelData]
  const numValue = parseInt(value) || 0
  
  if (field === 'lossRate') {
    newData[index] = { 
      ...newData[index], 
      lossRate: numValue,
      maxLossMoney: newData[index].bets * numValue
    }
  } else if (field === 'bets') {
    newData[index] = { 
      ...newData[index], 
      bets: numValue,
      maxLossMoney: numValue * newData[index].lossRate
    }
  } else {
    newData[index] = { ...newData[index], [field]: numValue }
  }
  
  setChannelData(newData)
}

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Game Channel Calculator</CardTitle>
          <CardDescription>
            Tool tính toán số ván chơi được dựa trên số vàng và thông tin kênh
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="calculate" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calculate">Tính toán</TabsTrigger>
          <TabsTrigger value="shop">Dữ liệu Shop</TabsTrigger>
          <TabsTrigger value="channels">Cấu hình Kênh</TabsTrigger>
        </TabsList>

        <TabsContent value="calculate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tính toán số ván chơi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customMoney">Số tiền (money)</Label>
                  <Input
                    id="customMoney"
                    type="number"
                    value={customMoney}
                    onChange={(e) => setCustomMoney(e.target.value)}
                    placeholder="Nhập số tiền"
                  />
                </div>
                <div>
                  <Label htmlFor="customGold">Hoặc số vàng trực tiếp</Label>
                  <Input
                    id="customGold"
                    type="number"
                    value={customGold}
                    onChange={(e) => setCustomGold(e.target.value)}
                    placeholder="Nhập số vàng"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={calculateCustom}>Tính toán tùy chỉnh</Button>
                <Button onClick={calculateAllResults} variant="outline">
                  Tính toán tất cả mốc shop
                </Button>
                <Button 
                  onClick={() => setShowDetails(!showDetails)} 
                  variant="secondary"
                  disabled={detailSteps.length === 0}
                >
                  {showDetails ? 'Ẩn' : 'Hiện'} chi tiết
                </Button>
              </div>

              {results.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Kết quả</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Money</TableHead>
                          <TableHead>Gold</TableHead>
                          <TableHead>Kết quả chơi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.map((result, index) => {
                          const parts = result.split(' ==> ')
                          const moneyPart = parts[0]
                          const goldAndResult = parts[1].split(' gold: ')
                          const goldPart = goldAndResult[0]
                          const gamePart = goldAndResult[1]
                          
                          return (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{moneyPart}</TableCell>
                              <TableCell>{goldPart}</TableCell>
                              <TableCell>{gamePart}</TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                    
                    {showDetails && detailSteps.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-semibold mb-2">Chi tiết từng bước:</h4>
                        <div className="space-y-1 max-h-60 overflow-y-auto">
                          {detailSteps.map((step, index) => (
                            <div key={index} className="text-sm p-1 bg-blue-50 rounded">
                              {step}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shop">
          <Card>
            <CardHeader>
              <CardTitle>Dữ liệu Shop</CardTitle>
              <CardDescription>Tỷ lệ chuyển đổi tiền thành vàng</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Money</TableHead>
                    <TableHead>Gold (ItemNum)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shopData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.money.toLocaleString()}</TableCell>
                      <TableCell>{item.itemNum.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="channels">
          <Card>
            <CardHeader>
              <CardTitle>Cấu hình Kênh</CardTitle>
              <CardDescription>Chỉnh sửa thông tin các kênh chơi</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Channel ID</TableHead>
                      <TableHead>Min Gold</TableHead>
                      <TableHead>Max Gold</TableHead>
                      <TableHead>Bets</TableHead>
                      <TableHead>Loss Rate</TableHead>
                      <TableHead>Max Loss Money</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {channelData.map((channel, index) => (
                      <TableRow key={channel.channelId}>
                        <TableCell>{channel.channelId}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={channel.minGold}
                            onChange={(e) => updateChannelData(index, 'minGold', e.target.value)}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={channel.maxGold}
                            onChange={(e) => updateChannelData(index, 'maxGold', e.target.value)}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={channel.bets}
                            onChange={(e) => updateChannelData(index, 'bets', e.target.value)}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={channel.lossRate}
                            onChange={(e) => updateChannelData(index, 'lossRate', e.target.value)}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="w-32 p-2 bg-gray-100 rounded text-center">
                            {channel.maxLossMoney.toLocaleString()}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
