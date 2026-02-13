# Генерация всех оставшихся товаров для автоматически регулируемых установок
$brands = @(
    @{name="Systeme electric"; multiplier=1.15; startId=979},
    @{name="EKF"; multiplier=0.95; startId=1028},
    @{name="TDM"; multiplier=0.90; startId=1077},
    @{name="Dekraft"; multiplier=0.85; startId=1126}
)

$products = @(
    @{power=90; current=130; dimensions="800x440x270/900x440x270"; weight=47; step=10},
    @{power=100; current=144; dimensions="800x440x270/900x440x270"; weight=48; step=10},
    @{power=100; current=144; dimensions="800x440x270/900x440x270"; weight=49; step=20},
    @{power=100; current=144; dimensions="800x440x270/900x440x270"; weight=49; step=25},
    @{power=125; current=180; dimensions="1150x600x450/1250x600x450"; weight=63; step=25},
    @{power=140; current=202; dimensions="1150x600x450/1250x600x450"; weight=67; step=20},
    @{power=150; current=216; dimensions="1150x600x450/1250x600x450"; weight=67; step=25},
    @{power=150; current=216; dimensions="1150x600x450/1250x600x450"; weight=69; step=30},
    @{power=150; current=216; dimensions="1150x600x450/1250x600x450"; weight=70; step=50},
    @{power=150; current=230; dimensions="1150x600x450/1250x600x450"; weight=72; step=20},
    @{power=175; current=252; dimensions="1150x600x450/1250x600x450"; weight=78; step=25},
    @{power=180; current=259; dimensions="1150x600x450/1250x600x450"; weight=85; step=20},
    @{power=180; current=259; dimensions="1150x600x450/1250x600x450"; weight=90; step=30},
    @{power=200; current=288; dimensions="1150x600x450/1250x600x450"; weight=93; step=25},
    @{power=200; current=288; dimensions="1150x600x450/1250x600x450"; weight=96; step=50},
    @{power=225; current=324; dimensions="1150x600x450/1250x600x450"; weight=100; step=25},
    @{power=250; current=360; dimensions="1150x600x450/1250x600x450"; weight=108; step=25},
    @{power=250; current=360; dimensions="1150x600x450/1250x600x450"; weight=110; step=50},
    @{power=275; current=396; dimensions="1800x600x600/1900x600x600"; weight=120; step=25},
    @{power=300; current=432; dimensions="1800x600x600/1900x600x600"; weight=125; step=25},
    @{power=300; current=432; dimensions="1800x600x600/1900x600x600"; weight=129; step=50},
    @{power=325; current=468; dimensions="1800x600x600/1900x600x600"; weight=130; step=25},
    @{power=350; current=504; dimensions="1800x600x600/1900x600x600"; weight=137; step=25},
    @{power=350; current=504; dimensions="1800x600x600/1900x600x600"; weight=142; step=50},
    @{power=375; current=540; dimensions="1800x600x600/1900x600x600"; weight=150; step=25},
    @{power=400; current=576; dimensions="1800x600x600/1900x600x600"; weight=167; step=25},
    @{power=400; current=576; dimensions="1800x600x600/1900x600x600"; weight=175; step=50},
    @{power=425; current=612; dimensions="1800x600x600/1900x600x600"; weight=179; step=25},
    @{power=450; current=648; dimensions="1800x600x600/1900x600x600"; weight=185; step=25},
    @{power=450; current=648; dimensions="1800x600x600/1900x600x600"; weight=184; step=50},
    @{power=475; current=684; dimensions="1800x600x600/1900x600x600"; weight=187; step=25},
    @{power=500; current=720; dimensions="1800x600x600/1900x600x600"; weight=190; step=25},
    @{power=500; current=720; dimensions="1800x600x600/1900x600x600"; weight=195; step=50},
    @{power=525; current=756; dimensions="1800x600x600/1900x600x600"; weight=197; step=25},
    @{power=550; current=792; dimensions="1800x600x600/1900x600x600"; weight=200; step=25},
    @{power=550; current=792; dimensions="1800x600x600/1900x600x600"; weight=202; step=50},
    @{power=575; current=828; dimensions="1800x600x600/1900x600x600"; weight=205; step=25},
    @{power=600; current=864; dimensions="1800x600x600/1900x600x600"; weight=210; step=50}
)

$main = Get-Content "data/products.json" -Raw -Encoding UTF8 | ConvertFrom-Json
$allNewProducts = @()

foreach ($brandInfo in $brands) {
    $currentId = $brandInfo.startId
    
    foreach ($product in $products) {
        $basePrice = [math]::Round((50000 + $product.power * 1000 + $product.step * 500) * $brandInfo.multiplier)
        
        $newProduct = [PSCustomObject]@{
            id = $currentId
            article = "АУКРМ-0,4-$($product.power)-$($product.step)-РОСЭК"
            power = $product.power
            brand = $brandInfo.name
            commutation_type = "reactive_power"
            regulation_type = "regulated"
            step = $product.step
            base_price = $basePrice
            main_image = "images/nky.jpg"
            images = @("images/nky.jpg", "images/nky2.jpg")
            description = "Автоматически регулируемая конденсаторная установка $($product.power) кВАр"
            fullDescription = "Автоматически регулируемая конденсаторная установка мощностью $($product.power) кВАр с $($product.step) ступенями регулирования."
            specs = [PSCustomObject]@{
                "Артикул" = "АУКРМ-0,4-$($product.power)-$($product.step)-РОСЭК"
                "Производитель" = $brandInfo.name
                "Мощность, кВАр" = $product.power.ToString()
                "Ток, Iном. А" = $product.current.ToString()
                "Габариты (ВхШхГ), мм" = $product.dimensions
                "Вес, кг" = "от $($product.weight)"
                "Количество ступеней" = $product.step.ToString()
            }
        }
        
        $allNewProducts += $newProduct
        $currentId++
    }
}

$main.products += $allNewProducts
$main | ConvertTo-Json -Depth 10 -Compress:$false | Set-Content "data/products.json" -Encoding UTF8

Write-Host "Добавлено $($allNewProducts.Count) товаров"
Write-Host "Всего товаров: $($main.products.Count)"
